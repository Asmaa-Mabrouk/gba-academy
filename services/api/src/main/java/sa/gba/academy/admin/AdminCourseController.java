package sa.gba.academy.admin;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.auth.Roles;
import sa.gba.academy.catalog.CatalogController;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.common.CourseWriter;
import sa.gba.academy.common.Json;
import sa.gba.academy.integrations.MessagingService;

/**
 * Admin: manage courses with their offerings and live sessions in one call, and decide on courses mentors submit.
 * The body has the same shape as GET /admin/courses/{id} (apps/web/src/lib/types.ts, `Course`).
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminCourseController {
    private static final String SELECT = "SELECT " + CatalogController.COURSE_STAFF_JSON + " FROM courses c";

    private final JdbcClient db;
    private final Roles roles;
    private final CourseWriter writer;
    private final MessagingService messaging;

    public AdminCourseController(JdbcClient db, Roles roles, CourseWriter writer, MessagingService messaging) {
        this.db = db;
        this.roles = roles;
        this.writer = writer;
        this.messaging = messaging;
    }

    @GetMapping("/courses")
    public ResponseEntity<String> list(HttpServletRequest req) {
        roles.require(req, "admin");
        // Courses waiting for a decision first, then the rest.
        return Json.array(db.sql(SELECT + " ORDER BY (c.status = 'pending') DESC, c.audience, c.title ->> 'ar'").query(String.class).list());
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<String> one(@PathVariable String id, HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.of(load(id));
    }

    @PostMapping("/courses")
    @Transactional
    public ResponseEntity<String> create(@RequestBody JsonNode b, HttpServletRequest req) {
        UUID admin = roles.require(req, "admin");
        String slug = CourseWriter.text(b, "slug");
        String id = "c-" + slug;
        if (db.sql("SELECT count(*) FROM courses WHERE id = :id OR slug = :s").param("id", id).param("s", slug).query(Integer.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "slug_exists");
        writer.saveCourse(id, b, new CourseWriter.Opts(null, true, "approved", admin));
        return Json.of(load(id));
    }

    @PutMapping("/courses/{id}")
    @Transactional
    public ResponseEntity<String> update(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        load(id); // 404 if missing
        writer.saveCourse(id, b, new CourseWriter.Opts(null, true, null, null));
        return Json.of(load(id));
    }

    @PutMapping("/courses/{id}/published")
    public ResponseEntity<String> publish(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        boolean want = b.path("published").asBoolean(false);
        String status = status(id);
        if (want && !"approved".equals(status)) throw new ApiException(HttpStatus.CONFLICT, "not_approved");
        db.sql("UPDATE courses SET published = :p WHERE id = :id").param("p", want).param("id", id).update();
        return Json.of(load(id));
    }

    /** Approve a submitted course. Body {"publish": true} (default) also makes it visible to learners. */
    @PostMapping("/courses/{id}/approve")
    @Transactional
    public ResponseEntity<String> approve(@PathVariable String id, @RequestBody(required = false) JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        if (!"pending".equals(status(id))) throw new ApiException(HttpStatus.CONFLICT, "not_pending");
        writer.requireComplete(id);
        boolean publish = b == null || b.path("publish").asBoolean(true);
        db.sql("UPDATE courses SET status = 'approved', published = :p, review_note = NULL WHERE id = :id").param("p", publish).param("id", id).update();
        tell(id, "course_approved", "");
        return Json.of(load(id));
    }

    /** Send a submitted course back to its mentor with a reason (required). The mentor can edit and submit again. */
    @PostMapping("/courses/{id}/reject")
    @Transactional
    public ResponseEntity<String> reject(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        if (!"pending".equals(status(id))) throw new ApiException(HttpStatus.CONFLICT, "not_pending");
        String note = b.path("note").asText("").trim();
        if (note.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_note");
        if (note.length() > 1000) note = note.substring(0, 1000);
        db.sql("UPDATE courses SET status = 'rejected', published = false, review_note = :n WHERE id = :id").param("n", note).param("id", id).update();
        tell(id, "course_rejected", note);
        return Json.of(load(id));
    }

    /** (Re)try creating the meeting link of a session that has none, e.g. when Google was unreachable at save time. */
    @PostMapping("/sessions/{id}/meeting")
    public ResponseEntity<Map<String, String>> meeting(@PathVariable String id, HttpServletRequest req) {
        roles.require(req, "admin");
        String url = writer.ensureMeeting(id);
        if (url == null) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "meeting_unavailable");
        return ResponseEntity.ok(Map.of("url", url));
    }

    // ---------------------------------------------------------------------------------------------

    private String load(String id) {
        List<String> r = db.sql(SELECT + " WHERE c.id = :id").param("id", id).query(String.class).list();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return r.get(0);
    }

    private String status(String id) {
        List<String> s = db.sql("SELECT status FROM courses WHERE id = :id").param("id", id).query(String.class).list();
        if (s.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return s.get(0);
    }

    /** E-mail the mentor who owns the course (when their profile is linked to a login). */
    private void tell(String courseId, String template, String note) {
        List<Map<String, Object>> r = db.sql("""
                SELECT u.email, c.slug FROM courses c JOIN mentors m ON m.id = c.mentor_id JOIN users u ON u.id = m.user_id WHERE c.id = :id""")
                .param("id", courseId).query().listOfRows();
        if (!r.isEmpty()) messaging.send((String) r.get(0).get("email"), template, Map.of("course", (String) r.get(0).get("slug"), "note", note));
    }
}
