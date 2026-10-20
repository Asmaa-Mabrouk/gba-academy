package sa.gba.academy.promo;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import sa.gba.academy.common.ApiException;

/** Promo code rules in one place: is the code valid for this learner, how much it takes off, and recording its use. */
@Service
public class PromoService {
    /** A checked code: the discount is a percentage of the order total (VAT included), rounded to the nearest halala. */
    public record Quote(UUID id, String code, int percentOff, long discountHalalas) {}

    private final JdbcClient db;

    public PromoService(JdbcClient db) { this.db = db; }

    public static String normalize(String raw) { return raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT); }

    /**
     * Check a code for a learner and an order total. Error codes: promo_invalid, promo_inactive, promo_expired,
     * promo_exhausted, promo_used. With `lock` the promo row is locked until the transaction ends, so two checkouts
     * cannot both take the last use: pass true when the order is really being placed.
     */
    public Quote quote(String rawCode, UUID userId, long grossHalalas, boolean lock) {
        String code = normalize(rawCode);
        if (code.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "promo_invalid");
        List<Map<String, Object>> r = db.sql("""
                SELECT id, percent_off, max_uses, used_count, active, (expires_at IS NOT NULL AND expires_at < now()) AS expired
                FROM promo_codes WHERE code = :c""" + (lock ? " FOR UPDATE" : "")).param("c", code).query().listOfRows();
        if (r.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "promo_invalid");
        Map<String, Object> p = r.get(0);
        if (!Boolean.TRUE.equals(p.get("active"))) throw new ApiException(HttpStatus.BAD_REQUEST, "promo_inactive");
        if (Boolean.TRUE.equals(p.get("expired"))) throw new ApiException(HttpStatus.BAD_REQUEST, "promo_expired");
        Number max = (Number) p.get("max_uses");
        if (max != null && ((Number) p.get("used_count")).intValue() >= max.intValue()) throw new ApiException(HttpStatus.BAD_REQUEST, "promo_exhausted");
        UUID id = (UUID) p.get("id");
        boolean used = db.sql("SELECT count(*) FROM promo_redemptions WHERE promo_id = :p AND user_id = :u")
                .param("p", id).param("u", userId).query(Integer.class).single() > 0;
        if (used) throw new ApiException(HttpStatus.BAD_REQUEST, "promo_used");
        int pct = ((Number) p.get("percent_off")).intValue();
        long discount = Math.min(grossHalalas, Math.round(grossHalalas * pct / 100.0));
        return new Quote(id, code, pct, discount);
    }

    /** Record the use after the order row exists. The UPDATE is the real guard: it fails when the last use is gone. */
    public void redeem(Quote q, UUID userId, UUID orderId) {
        int n = db.sql("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = :id AND (max_uses IS NULL OR used_count < max_uses)")
                .param("id", q.id()).update();
        if (n == 0) throw new ApiException(HttpStatus.BAD_REQUEST, "promo_exhausted");
        db.sql("INSERT INTO promo_redemptions(promo_id, user_id, order_id, discount_halalas) VALUES (:p, :u, :o, :d)")
                .param("p", q.id()).param("u", userId).param("o", orderId).param("d", (int) q.discountHalalas()).update();
    }
}
