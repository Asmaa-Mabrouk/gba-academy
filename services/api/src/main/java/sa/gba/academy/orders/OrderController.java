package sa.gba.academy.orders;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.auth.AuthInterceptor;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.common.Json;
import sa.gba.academy.integrations.EInvoiceService;
import sa.gba.academy.integrations.MessagingService;
import sa.gba.academy.integrations.PaymentGateway;
import sa.gba.academy.promo.PromoService;

@RestController
@RequestMapping("/api/v1")
public class OrderController {
    public record Line(String offeringId) {}
    public record OrderRequest(@NotEmpty List<Line> lines, String paymentMethod, String promoCode) {}

    private final JdbcClient db;
    private final PaymentGateway payments;
    private final EInvoiceService invoices;
    private final MessagingService messaging;
    private final PromoService promos;

    public OrderController(JdbcClient db, PaymentGateway payments, EInvoiceService invoices, MessagingService messaging, PromoService promos) {
        this.db = db;
        this.promos = promos;
        this.payments = payments;
        this.invoices = invoices;
        this.messaging = messaging;
    }

    /** Prices come from the database, never from the browser. */
    @PostMapping("/orders")
    @Transactional
    public ResponseEntity<String> create(@Valid @RequestBody OrderRequest req, HttpServletRequest http) {
        UUID userId = AuthInterceptor.require(http);
        String requested = switch (String.valueOf(req.paymentMethod())) {
            case "mada", "applepay", "card" -> req.paymentMethod();
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_payment_method");
        };
        // The same offering twice in one request is bought once.
        List<Line> lines = req.lines().stream().filter(l -> l.offeringId() != null).distinct().toList();
        long total = 0;
        for (Line l : lines) {
            boolean owned = db.sql("SELECT count(*) FROM enrollments WHERE user_id = :u AND offering_id = :o")
                    .param("u", userId).param("o", l.offeringId()).query(Integer.class).single() > 0;
            if (owned) throw new ApiException(HttpStatus.CONFLICT, "already_enrolled");
            List<Map<String, Object>> o = db.sql("SELECT price_halalas FROM offerings WHERE id = :id").param("id", l.offeringId()).query().listOfRows();
            if (o.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "unknown_offering");
            // Lock the offering row so two buyers cannot both take the last place of a live cohort.
            db.sql("SELECT id FROM offerings WHERE id = :id FOR UPDATE").param("id", l.offeringId()).query(String.class).list();
            long full = db.sql("""
                    SELECT (SELECT count(*) FROM live_sessions WHERE offering_id = :id AND seats_taken >= seats)
                         + (SELECT count(*) FROM offerings o WHERE o.id = :id AND o.capacity IS NOT NULL
                              AND (SELECT count(*) FROM enrollments e WHERE e.offering_id = o.id) >= o.capacity)""")
                    .param("id", l.offeringId()).query(Long.class).single();
            if (full > 0) throw new ApiException(HttpStatus.CONFLICT, "sold_out");
            total += ((Number) o.get(0).get("price_halalas")).longValue();
        }
        // Promo code: a percentage off the VAT-inclusive total. A 100% code makes the order free.
        PromoService.Quote promo = null;
        if (req.promoCode() != null && !req.promoCode().isBlank()) {
            promo = promos.quote(req.promoCode(), userId, total, true);
            total -= promo.discountHalalas();
        }
        long net = Pricing.net(total);
        long vat = total - net;
        String number = "GBA-%d-%05d".formatted(java.time.Year.now().getValue(), db.sql("SELECT nextval('order_seq')").query(Long.class).single());

        // Free courses skip the payment gateway and the tax invoice.
        boolean free = total == 0;
        String method = free ? "free" : requested;
        PaymentGateway.Charge charge = free ? new PaymentGateway.Charge(true, null, null) : payments.charge(number, total, method);
        if (!charge.success()) throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "payment_failed");

        Map<String, Object> user = db.sql("SELECT full_name, email FROM users WHERE id = :id").param("id", userId).query().singleRow();
        String invoiceNo = free ? null : invoices.issue(new EInvoiceService.InvoiceRequest(number, (String) user.get("full_name"), (String) user.get("email"), net, vat, total));

        UUID orderId = db.sql("""
                INSERT INTO orders(number, user_id, status, subtotal_halalas, vat_halalas, total_halalas, payment_method, gateway_ref, invoice_number,
                  promo_code, discount_halalas)
                VALUES (:n, :u, 'paid', :s, :v, :t, :m, :g, :i, :pc, :pd) RETURNING id""")
                .param("n", number).param("u", userId).param("s", net).param("v", vat).param("t", total)
                .param("m", method).param("g", charge.reference()).param("i", invoiceNo)
                .param("pc", promo == null ? null : promo.code()).param("pd", promo == null ? 0 : (int) promo.discountHalalas())
                .query(UUID.class).single();
        if (promo != null) promos.redeem(promo, userId, orderId);

        for (Line l : lines) {
            db.sql("INSERT INTO order_lines(order_id, offering_id, price_halalas) SELECT :o, id, price_halalas FROM offerings WHERE id = :id")
                    .param("o", orderId).param("id", l.offeringId()).update();
            int created = db.sql("""
                    INSERT INTO enrollments(user_id, offering_id, order_id, expires_at)
                    SELECT :u, o.id, :o, CASE WHEN o.access_days IS NULL THEN NULL ELSE now() + make_interval(days => o.access_days) END
                    FROM offerings o WHERE o.id = :id ON CONFLICT (user_id, offering_id) DO NOTHING""")
                    .param("u", userId).param("o", orderId).param("id", l.offeringId()).update();
            if (created > 0) {
                db.sql("UPDATE live_sessions SET seats_taken = seats_taken + 1 WHERE offering_id = :id").param("id", l.offeringId()).update();
                db.sql("UPDATE courses SET learners = learners + 1 WHERE id = (SELECT course_id FROM offerings WHERE id = :id)").param("id", l.offeringId()).update();
            }
        }
        messaging.send((String) user.get("email"), "order_receipt", Map.of("order", number, "invoice", invoiceNo == null ? "" : invoiceNo));
        return Json.of(orderJson(orderId));
    }

    private String orderJson(UUID id) {
        return db.sql("""
                SELECT json_build_object('id',o.id,'number',o.number,'status',o.status,'subtotalHalalas',o.subtotal_halalas,
                  'vatHalalas',o.vat_halalas,'totalHalalas',o.total_halalas,'paymentMethod',o.payment_method,
                  'createdAt',o.created_at,'invoiceNumber',o.invoice_number,'promoCode',o.promo_code,'discountHalalas',o.discount_halalas,
                  'lines',(SELECT coalesce(json_agg(json_build_object('offeringId',l.offering_id,'courseSlug',c.slug,
                      'mode',f.mode,'priceHalalas',l.price_halalas)),'[]'::json)
                      FROM order_lines l JOIN offerings f ON f.id = l.offering_id JOIN courses c ON c.id = f.course_id
                      WHERE l.order_id = o.id))::text
                FROM orders o WHERE o.id = :id""").param("id", id).query(String.class).single();
    }
}
