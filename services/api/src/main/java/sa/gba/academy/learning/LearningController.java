package sa.gba.academy.learning;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.auth.AuthInterceptor;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.admin.RatingService;
import sa.gba.academy.common.CourseWriter;
import sa.gba.academy.common.Json;

/** My courses, lesson progress, certificates and reviews (only enrolled learners may review). */
@RestController
@RequestMapping("/api/v1")
public class LearningController {
    public record ReviewRequest(@Min(1) @Max(5) int rating, @NotBlank String comment) {}

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String ENROLLMENT_JSON = """
            SELECT json_build_object('id',e.id,'courseSlug',c.slug,'offeringId',e.offering_id,'mode',o.mode,
              'enrolledAt',e.enrolled_at,'expiresAt',e.expires_at,'completedLessonIds',e.completed_lesson_ids,
              'progressPct',e.progress_pct,'certificateCode',e.certificate_code,'completedAt',e.completed_at,
              'nextSession',(SELECT json_build_object('id',s.id,'startsAt',s.starts_at,'durationMin',s.duration_min,
                    'seats',s.seats,'seatsLeft',s.seats - s.seats_taken,'title',s.title)
                  FROM live_sessions s WHERE s.offering_id = e.offering_id AND s.starts_at > now()
                  ORDER BY s.starts_at LIMIT 1))::text
            FROM enrollments e JOIN offerings o ON o.id = e.offering_id JOIN courses c ON c.id = o.course_id""";

    private final JdbcClient db;
    private final RatingService ratings;
    private final CourseWriter writer;

    public LearningController(JdbcClient db, RatingService ratings, CourseWriter writer) {
        this.db = db;
        this.ratings = ratings;
        this.writer = writer;
    }

    @GetMapping("/me/enrollments")
    public ResponseEntity<String> mine(HttpServletRequest req) {
        UUID uid = AuthInterceptor.require(req);
        return Json.array(db.sql(ENROLLMENT_JSON + " WHERE e.user_id = :u ORDER BY e.enrolled_at DESC").param("u", uid).query(String.class).list());
    }

    @PostMapping("/me/enrollments/{slug}/lessons/{lessonId}/complete")
    public ResponseEntity<String> complete(@PathVariable String slug, @PathVariable String lessonId, HttpServletRequest req) {
        UUID uid = AuthInterceptor.require(req);
        // A lesson with a quiz is completed by passing the quiz, not by clicking "done".
        boolean hasQuiz = db.sql("SELECT count(*) FROM courses WHERE slug = :s AND jsonb_exists(quizzes, :l)").param("s", slug).param("l", lessonId)
                .query(Integer.class).single() > 0;
        if (hasQuiz) throw new ApiException(HttpStatus.BAD_REQUEST, "quiz_required");
        return Json.of(markComplete(uid, slug, lessonId));
    }

    /** What an enrolled learner may watch and download: lesson videos, lesson files, course files, and which lessons have a quiz. */
    @GetMapping("/me/enrollments/{slug}/content")
    public ResponseEntity<String> content(@PathVariable String slug, HttpServletRequest req) {
        requireEnrolled(AuthInterceptor.require(req), slug);
        List<Map<String, Object>> r = db.sql("SELECT modules::text AS modules, quizzes::text AS quizzes, materials::text AS materials FROM courses WHERE slug = :s")
                .param("s", slug).query().listOfRows();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        JsonNode modules = parse((String) r.get(0).get("modules"));
        JsonNode quizzes = parse((String) r.get(0).get("quizzes"));
        for (JsonNode m : modules) for (JsonNode l : m.path("lessons"))
            if (l instanceof ObjectNode lo) lo.put("hasQuiz", quizzes.path(l.path("id").asText()).isObject());
        ObjectNode out = MAPPER.createObjectNode();
        out.set("modules", modules);
        out.set("materials", parse((String) r.get(0).get("materials")));
        return Json.of(out.toString());
    }

    /** The questions of a lesson's quiz, without the answers. */
    @GetMapping("/me/enrollments/{slug}/lessons/{lessonId}/quiz")
    public ResponseEntity<String> quiz(@PathVariable String slug, @PathVariable String lessonId, HttpServletRequest req) {
        requireEnrolled(AuthInterceptor.require(req), slug);
        JsonNode quiz = quizOf(slug, lessonId);
        ObjectNode out = MAPPER.createObjectNode();
        out.put("passPct", quiz.path("passPct").asInt(70));
        ArrayNode qs = out.putArray("questions");
        for (JsonNode q : quiz.path("questions")) {
            ObjectNode o = qs.addObject();
            o.put("id", q.path("id").asText());
            o.set("prompt", q.path("prompt"));
            ArrayNode os = o.putArray("options");
            for (JsonNode op : q.path("options")) {
                ObjectNode x = os.addObject();
                x.put("id", op.path("id").asText());
                x.set("text", op.path("text"));
            }
        }
        return Json.of(out.toString());
    }

    /**
     * Grade a quiz on the server. Body {"answers": {questionId: optionId}}. Passing completes the lesson.
     * Returns the score, whether it passed, the right answers with their explanations, and the updated enrollment when passed.
     */
    @PostMapping("/me/enrollments/{slug}/lessons/{lessonId}/quiz")
    public ResponseEntity<String> submitQuiz(@PathVariable String slug, @PathVariable String lessonId, @RequestBody JsonNode body, HttpServletRequest req) {
        UUID uid = AuthInterceptor.require(req);
        requireEnrolled(uid, slug);
        JsonNode quiz = quizOf(slug, lessonId);
        int total = quiz.path("questions").size();
        int right = 0;
        ObjectNode out = MAPPER.createObjectNode();
        ArrayNode results = out.putArray("results");
        for (JsonNode q : quiz.path("questions")) {
            String correctId = q.path("correctId").asText("");
            boolean ok = !correctId.isEmpty() && correctId.equals(body.path("answers").path(q.path("id").asText()).asText(""));
            if (ok) right++;
            ObjectNode r = results.addObject();
            r.put("id", q.path("id").asText());
            r.put("correct", ok);
            r.put("correctId", correctId);
            if (q.has("explanation")) r.set("explanation", q.get("explanation"));
        }
        int scorePct = total == 0 ? 0 : (int) Math.round(100.0 * right / total);
        boolean passed = total > 0 && scorePct >= quiz.path("passPct").asInt(70);
        out.put("correct", right);
        out.put("total", total);
        out.put("scorePct", scorePct);
        out.put("passPct", quiz.path("passPct").asInt(70));
        out.put("passed", passed);
        if (passed) out.set("enrollment", parse(markComplete(uid, slug, lessonId)));
        else out.putNull("enrollment");
        return Json.of(out.toString());
    }

    /** The link to join a live session you are enrolled in. */
    @GetMapping("/me/sessions/{id}/join")
    public ResponseEntity<Map<String, String>> joinSession(@PathVariable String id, HttpServletRequest req) {
        UUID uid = AuthInterceptor.require(req);
        boolean enrolled = db.sql("""
                SELECT count(*) FROM live_sessions s JOIN enrollments e ON e.offering_id = s.offering_id
                WHERE s.id = :s AND e.user_id = :u AND (e.expires_at IS NULL OR e.expires_at > now())""")
                .param("s", id).param("u", uid).query(Integer.class).single() > 0;
        if (!enrolled) throw new ApiException(HttpStatus.FORBIDDEN, "not_enrolled");
        String url = writer.ensureMeeting(id);
        if (url == null) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "meeting_unavailable");
        return ResponseEntity.ok(Map.of("url", url));
    }

    private void requireEnrolled(UUID uid, String slug) {
        boolean ok = db.sql("""
                SELECT count(*) FROM enrollments e JOIN offerings o ON o.id = e.offering_id JOIN courses c ON c.id = o.course_id
                WHERE e.user_id = :u AND c.slug = :s AND (e.expires_at IS NULL OR e.expires_at > now())""")
                .param("u", uid).param("s", slug).query(Integer.class).single() > 0;
        if (!ok) throw new ApiException(HttpStatus.FORBIDDEN, "not_enrolled");
    }

    private JsonNode quizOf(String slug, String lessonId) {
        List<String> r = db.sql("SELECT quizzes::text FROM courses WHERE slug = :s").param("s", slug).query(String.class).list();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        JsonNode q = parse(r.get(0)).path(lessonId);
        if (!q.isObject()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return q;
    }

    private static JsonNode parse(String json) {
        try {
            return MAPPER.readTree(json);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("invalid JSON from the database", e);
        }
    }

    /** Mark a lesson done, recompute progress, and issue the certificate when everything is done. Returns the enrollment JSON. */
    private String markComplete(UUID uid, String slug, String lessonId) {
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
                  completed_at = COALESCE(e.completed_at, CASE WHEN cardinality(e.completed_lesson_ids) >=
                      (SELECT count(*) FROM courses c4, json_array_elements(c4.modules::json) m4, json_array_elements(m4 -> 'lessons') l4 WHERE c4.id = c.id)
                      THEN now() END),
                  certificate_code = COALESCE(e.certificate_code, CASE WHEN cardinality(e.completed_lesson_ids) >=
                      (SELECT count(*) FROM courses c3, json_array_elements(c3.modules::json) m3, json_array_elements(m3 -> 'lessons') l3 WHERE c3.id = c.id)
                      THEN 'GBA-' || upper(substr(md5(random()::text), 1, 6)) END)
                FROM offerings o JOIN courses c ON c.id = o.course_id
                WHERE e.offering_id = o.id AND e.user_id = :u AND c.slug = :s""")
                .param("u", uid).param("s", slug).update();
        return db.sql(ENROLLMENT_JSON + " WHERE e.user_id = :u AND c.slug = :s").param("u", uid).param("s", slug).query(String.class).single();
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
