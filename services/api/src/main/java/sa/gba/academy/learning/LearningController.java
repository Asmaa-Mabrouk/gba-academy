package sa.gba.academy.learning;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.auth.AuthInterceptor;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.admin.RatingService;
import sa.gba.academy.common.Json;

/** My courses, lesson progress, certificates and reviews (only enrolled learners may review). */
@RestController
@RequestMapping("/api/v1")
public class LearningController {
    public record ReviewRequest(@Min(1) @Max(5) int rating, @NotBlank String comment) {}

    private static final String ENROLLMENT_JSON = """
            SELECT json_build_object('id',e.id,'courseSlug',c.slug,'offeringId',e.offering_id,'mode',o.mode,
              'enrolledAt',e.enrolled_at,'expiresAt',e.expires_at,'completedLessonIds',e.completed_lesson_ids,
              'progressPct',e.progress_pct,'certificateCode',e.certificate_code,
              'nextSession',(SELECT json_build_object('id',s.id,'startsAt',s.starts_at,'durationMin',s.duration_min,
                    'seats',s.seats,'seatsLeft',s.seats - s.seats_taken,'title',s.title)
                  FROM live_sessions s WHERE s.offering_id = e.offering_id AND s.starts_at > now()
                  ORDER BY s.starts_at LIMIT 1))::text
            FROM enrollments e JOIN offerings o ON o.id = e.offering_id JOIN courses c ON c.id = o.course_id""";

    private final JdbcClient db;
    private final RatingService ratings;

    public LearningController(JdbcClient db, RatingService ratings) {
        this.db = db;
        this.ratings = ratings;
    }

    @GetMapping("/me/enrollments")
    public ResponseEntity<String> mine(HttpServletRequest req) {
        UUID uid = AuthInterceptor.require(req);
        return Json.array(db.sql(ENROLLMENT_JSON + " WHERE e.user_id = :u ORDER BY e.enrolled_at DESC").param("u", uid).query(String.class).list());
    }

    @PostMapping("/me/enrollments/{slug}/lessons/{lessonId}/complete")
    public ResponseEntity<String> complete(@PathVariable String slug, @PathVariable String lessonId, HttpServletRequest req) {
        UUID uid = AuthInterceptor.require(req);
        // Lesson ids live inside courses.modules (JSON). Count them in SQL.
        int updated = db.sql("""
                UPDATE enrollments e SET
                  completed_lesson_ids = CASE WHEN :l = ANY(e.completed_lesson_ids) THEN e.completed_lesson_ids ELSE array_append(e.completed_lesson_ids, :l) END
                FROM offerings o JOIN courses c ON c.id = o.course_id
                WHERE e.offering_id = o.id AND e.user_id = :u AND c.slug = :s""")
                .param("l", lessonId).param("u", uid).param("s", slug).update();
        if (updated == 0) throw new ApiException(HttpStatus.FORBIDDEN, "not_enrolled");
        db.sql("""
                UPDATE enrollments e SET
                  progress_pct = LEAST(100, round(100.0 * cardinality(e.completed_lesson_ids) /
                      GREATEST(1, (SELECT count(*) FROM courses c2, json_array_elements(c2.modules::json) m, json_array_elements(m -> 'lessons') l WHERE c2.id = c.id)))),
                  certificate_code = COALESCE(e.certificate_code, CASE WHEN cardinality(e.completed_lesson_ids) >=
                      (SELECT count(*) FROM courses c3, json_array_elements(c3.modules::json) m3, json_array_elements(m3 -> 'lessons') l3 WHERE c3.id = c.id)
                      THEN 'GBA-' || upper(substr(md5(random()::text), 1, 6)) END)
                FROM offerings o JOIN courses c ON c.id = o.course_id
                WHERE e.offering_id = o.id AND e.user_id = :u AND c.slug = :s""")
                .param("u", uid).param("s", slug).update();
        return Json.of(db.sql(ENROLLMENT_JSON + " WHERE e.user_id = :u AND c.slug = :s").param("u", uid).param("s", slug).query(String.class).single());
    }

    @PostMapping("/courses/{slug}/reviews")
    public ResponseEntity<String> review(@PathVariable String slug, @Valid @RequestBody ReviewRequest body, HttpServletRequest req) {
        UUID uid = AuthInterceptor.require(req);
        boolean enrolled = db.sql("""
                SELECT count(*) FROM enrollments e JOIN offerings o ON o.id = e.offering_id JOIN courses c ON c.id = o.course_id
                WHERE e.user_id = :u AND c.slug = :s""").param("u", uid).param("s", slug).query(Integer.class).single() > 0;
        if (!enrolled) throw new ApiException(HttpStatus.FORBIDDEN, "not_enrolled");
        String id = "r-" + UUID.randomUUID();
        String comment = "{\"ar\":" + quote(body.comment()) + ",\"en\":" + quote(body.comment()) + "}";
        db.sql("""
                INSERT INTO reviews(id, course_id, user_id, author, rating, comment)
                SELECT :id, c.id, :u, u.full_name, :r, :cm::jsonb FROM courses c, users u WHERE c.slug = :s AND u.id = :u""")
                .param("id", id).param("u", uid).param("r", body.rating()).param("cm", comment).param("s", slug).update();
        ratings.added(db.sql("SELECT id FROM courses WHERE slug = :s").param("s", slug).query(String.class).single(), body.rating());
        return Json.of(db.sql("""
                SELECT json_build_object('id',r.id,'courseSlug',c.slug,'author',r.author,'rating',r.rating,'comment',r.comment,
                  'createdAt',r.created_at)::text FROM reviews r JOIN courses c ON c.id = r.course_id WHERE r.id = :id""")
                .param("id", id).query(String.class).single());
    }

    private static String quote(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (char ch : s.toCharArray()) {
            switch (ch) {
                case '"' -> b.append("\\\"");
                case '\\' -> b.append("\\\\");
                case '\n' -> b.append("\\n");
                case '\r' -> b.append("\\r");
                case '\t' -> b.append("\\t");
                default -> { if (ch < 0x20) b.append(String.format("\\u%04x", (int) ch)); else b.append(ch); }
            }
        }
        return b.append('"').toString();
    }
}
