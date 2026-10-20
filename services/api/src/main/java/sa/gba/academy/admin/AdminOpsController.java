package sa.gba.academy.admin;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.auth.Roles;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.common.Json;

/** Admin: dashboard numbers, orders and review moderation. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminOpsController {
    private final JdbcClient db;
    private final Roles roles;
    private final RatingService ratings;

    public AdminOpsController(JdbcClient db, Roles roles, RatingService ratings) {
        this.db = db;
        this.roles = roles;
        this.ratings = ratings;
    }

    @GetMapping("/stats")
    public ResponseEntity<String> stats(HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.of(db.sql("""
                SELECT json_build_object(
                  'users',(SELECT count(*) FROM users),
                  'courses',(SELECT count(*) FROM courses),
                  'publishedCourses',(SELECT count(*) FROM courses WHERE published),
                  'pendingCourses',(SELECT count(*) FROM courses WHERE status = 'pending'),
                  'mentors',(SELECT count(*) FROM mentors),
                  'enrollments',(SELECT count(*) FROM enrollments),
                  'orders',(SELECT count(*) FROM orders WHERE status = 'paid'),
                  'revenueHalalas',(SELECT coalesce(sum(total_halalas),0) FROM orders WHERE status = 'paid'),
                  'revenue30dHalalas',(SELECT coalesce(sum(total_halalas),0) FROM orders WHERE status = 'paid' AND created_at > now() - interval '30 days'),
                  'upcomingSessions',(SELECT count(*) FROM live_sessions WHERE starts_at > now()),
                  'topCourses',(SELECT coalesce(json_agg(t),'[]'::json) FROM (
                       SELECT slug, title, learners FROM courses ORDER BY learners DESC LIMIT 5) t)
                )::text""").query(String.class).single());
    }

    @GetMapping("/orders")
    public ResponseEntity<String> orders(HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.array(db.sql("""
                SELECT json_build_object('id',o.id,'number',o.number,'status',o.status,'totalHalalas',o.total_halalas,
                  'vatHalalas',o.vat_halalas,'paymentMethod',o.payment_method,'invoiceNumber',o.invoice_number,
                  'promoCode',o.promo_code,'discountHalalas',o.discount_halalas,
                  'createdAt',o.created_at,'userName',u.full_name,'userEmail',u.email,
                  'lines',(SELECT coalesce(json_agg(json_build_object('courseSlug',c.slug,'courseTitle',c.title,'mode',f.mode,
                       'priceHalalas',l.price_halalas)),'[]'::json)
                       FROM order_lines l JOIN offerings f ON f.id = l.offering_id JOIN courses c ON c.id = f.course_id
                       WHERE l.order_id = o.id))::text
                FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 200""").query(String.class).list());
    }

    @GetMapping("/reviews")
    public ResponseEntity<String> reviews(HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.array(db.sql("""
                SELECT json_build_object('id',r.id,'courseSlug',c.slug,'courseTitle',c.title,'author',r.author,'rating',r.rating,
                  'comment',r.comment,'mentorReply',r.mentor_reply,'createdAt',r.created_at)::text
                FROM reviews r JOIN courses c ON c.id = r.course_id ORDER BY r.created_at DESC LIMIT 500""").query(String.class).list());
    }

    @DeleteMapping("/reviews/{id}")
    @Transactional
    public ResponseEntity<Map<String, Boolean>> deleteReview(@PathVariable String id, HttpServletRequest req) {
        roles.require(req, "admin");
        List<Map<String, Object>> r = db.sql("SELECT course_id, rating FROM reviews WHERE id = :id").param("id", id).query().listOfRows();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        db.sql("DELETE FROM reviews WHERE id = :id").param("id", id).update();
        ratings.removed((String) r.get(0).get("course_id"), ((Number) r.get(0).get("rating")).intValue());
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    /** Set or clear the mentor's public reply. Body: {"ar":"...","en":"..."} or {} to clear. */
    @PutMapping("/reviews/{id}/reply")
    public ResponseEntity<Map<String, Boolean>> reply(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        String ar = b.path("ar").asText("").trim();
        String en = b.path("en").asText("").trim();
        String json = null;
        if (!ar.isEmpty() || !en.isEmpty()) {
            var o = new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
            o.put("ar", ar.isEmpty() ? en : ar);
            o.put("en", en.isEmpty() ? ar : en);
            json = o.toString();
        }
        int n = db.sql("UPDATE reviews SET mentor_reply = :r::jsonb WHERE id = :id").param("r", json).param("id", id).update();
        if (n == 0) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
