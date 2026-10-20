package sa.gba.academy.mentor;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import sa.gba.academy.integrations.LiveVideo;

/**
 * Mentor portal. Every call is scoped to the mentor profile linked to the signed-in account (mentors.user_id).
 * A mentor can edit the content of their own courses and their live sessions, see learners' progress (names only,
 * never emails or phone numbers) and reply to reviews. Prices, offerings, publishing and course creation stay with admins.
 */
@RestController
@RequestMapping("/api/v1/mentor")
public class MentorPortalController {
    private static final String COURSES = "SELECT " + CatalogController.COURSE_JSON + " FROM courses c";
    private static final String PROFILE = """
            SELECT json_build_object('id',m.id,'slug',m.slug,'name',m.name,'title',m.title,'bio',m.bio,'expertise',m.expertise,
              'languages',m.languages,'rating',m.rating,'reviewCount',m.review_count,
              'courseCount',(SELECT count(*) FROM courses c WHERE c.mentor_id = m.id),'learners',m.learners,'hue',m.hue)::text
            FROM mentors m WHERE m.id = :m""";

    private final JdbcClient db;
    private final Roles roles;
    private final CourseWriter writer;
    private final LiveVideo live;

    public MentorPortalController(JdbcClient db, Roles roles, CourseWriter writer, LiveVideo live) {
        this.db = db;
        this.roles = roles;
        this.writer = writer;
        this.live = live;
    }

    /** The signed-in user's mentor profile id, or 403. */
    private String mentorId(HttpServletRequest req) {
        UUID user = roles.require(req, "mentor");
        List<String> m = db.sql("SELECT id FROM mentors WHERE user_id = :u").param("u", user).query(String.class).list();
        if (m.isEmpty()) throw new ApiException(HttpStatus.FORBIDDEN, "no_mentor_profile");
        return m.get(0);
    }

    private void ownCourse(String mentorId, String courseId) {
        boolean ok = db.sql("SELECT count(*) FROM courses WHERE id = :c AND mentor_id = :m").param("c", courseId).param("m", mentorId)
                .query(Integer.class).single() > 0;
        if (!ok) throw new ApiException(HttpStatus.NOT_FOUND, "not_found"); // 404, not 403: do not reveal other mentors' courses
    }

    @GetMapping("/me")
    public ResponseEntity<String> me(HttpServletRequest req) {
        return Json.of(db.sql(PROFILE).param("m", mentorId(req)).query(String.class).single());
    }

    @PutMapping("/me")
    public ResponseEntity<String> updateMe(@RequestBody JsonNode b, HttpServletRequest req) {
        String m = mentorId(req);
        List<String> exp = new ArrayList<>();
        for (JsonNode n : b.path("expertise")) { String v = n.asText("").trim().replace(",", " "); if (!v.isEmpty()) exp.add(v); }
        List<String> langs = new ArrayList<>();
        for (JsonNode n : b.path("languages")) if ("ar".equals(n.asText()) || "en".equals(n.asText())) langs.add(n.asText());
        db.sql("""
                UPDATE mentors SET name = :name::jsonb, title = :title::jsonb, bio = :bio::jsonb,
                  expertise = string_to_array(:exp, ','), languages = string_to_array(:langs, ','), hue = :hue WHERE id = :m""")
                .param("name", writer.bilingual(b, "name", true)).param("title", writer.bilingual(b, "title", false))
                .param("bio", writer.bilingual(b, "bio", false)).param("exp", String.join(",", exp))
                .param("langs", String.join(",", langs.isEmpty() ? List.of("ar") : langs)).param("hue", b.path("hue").asInt(40)).param("m", m).update();
        return Json.of(db.sql(PROFILE).param("m", m).query(String.class).single());
    }

    @GetMapping("/stats")
    public ResponseEntity<String> stats(HttpServletRequest req) {
        String m = mentorId(req);
        return Json.of(db.sql("""
                SELECT json_build_object(
                  'courses',(SELECT count(*) FROM courses WHERE mentor_id = :m),
                  'learners',(SELECT count(DISTINCT e.user_id) FROM enrollments e JOIN offerings o ON o.id = e.offering_id JOIN courses c ON c.id = o.course_id WHERE c.mentor_id = :m),
                  'rating',(SELECT rating FROM mentors WHERE id = :m),
                  'reviewCount',(SELECT review_count FROM mentors WHERE id = :m),
                  'upcomingSessions',(SELECT count(*) FROM live_sessions s JOIN offerings o ON o.id = s.offering_id JOIN courses c ON c.id = o.course_id WHERE c.mentor_id = :m AND s.starts_at > now()),
                  'grossHalalas',(SELECT coalesce(sum(l.price_halalas),0) FROM order_lines l JOIN orders od ON od.id = l.order_id AND od.status = 'paid'
                       JOIN offerings f ON f.id = l.offering_id JOIN courses c ON c.id = f.course_id WHERE c.mentor_id = :m),
                  'byCourse',(SELECT coalesce(json_agg(x),'[]'::json) FROM (
                       SELECT c.slug, c.title,
                         (SELECT count(*) FROM enrollments e JOIN offerings o ON o.id = e.offering_id WHERE o.course_id = c.id) AS learners,
                         (SELECT coalesce(sum(l.price_halalas),0) FROM order_lines l JOIN orders od ON od.id = l.order_id AND od.status = 'paid'
                            JOIN offerings f ON f.id = l.offering_id WHERE f.course_id = c.id) AS "grossHalalas"
                       FROM courses c WHERE c.mentor_id = :m ORDER BY c.title ->> 'ar') x)
                )::text""").param("m", m).query(String.class).single());
    }

    @GetMapping("/courses")
    public ResponseEntity<String> courses(HttpServletRequest req) {
        String m = mentorId(req);
        return Json.array(db.sql(COURSES + " WHERE c.mentor_id = :m ORDER BY c.title ->> 'ar'").param("m", m).query(String.class).list());
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<String> course(@PathVariable String id, HttpServletRequest req) {
        ownCourse(mentorId(req), id);
        return Json.of(db.sql(COURSES + " WHERE c.id = :id").param("id", id).query(String.class).single());
    }

    /**
     * Update the content of an own course: texts, outcomes, syllabus, hours, age range, languages, and the live sessions of
     * its existing offerings. Everything else in the body (price, slug, audience, publishing, offerings added or removed) is ignored.
     */
    @PutMapping("/courses/{id}")
    @Transactional
    public ResponseEntity<String> updateCourse(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        ownCourse(mentorId(req), id);
        List<String> langs = new ArrayList<>();
        for (JsonNode l : b.path("languages")) if ("ar".equals(l.asText()) || "en".equals(l.asText())) langs.add(l.asText());
        if (langs.isEmpty()) langs.add("ar");
        db.sql("""
                UPDATE courses SET title = :title::jsonb, subtitle = :sub::jsonb, description = :descr::jsonb,
                  outcomes = :outc::jsonb, modules = :modl::jsonb, hours = :hours, languages = string_to_array(:langs, ','), age_range = :age
                WHERE id = :id""")
                .param("title", writer.bilingual(b, "title", true)).param("sub", writer.bilingual(b, "subtitle", false))
                .param("descr", writer.bilingual(b, "description", false)).param("outc", b.path("outcomes").isArray() ? b.get("outcomes").toString() : "[]")
                .param("modl", writer.modules(b.path("modules"))).param("hours", Math.max(0, b.path("hours").asInt(0)))
                .param("langs", String.join(",", langs))
                .param("age", b.hasNonNull("ageRange") && !b.get("ageRange").asText().isBlank() ? b.get("ageRange").asText() : null)
                .param("id", id).update();
        Set<String> mine = Set.copyOf(db.sql("SELECT id FROM offerings WHERE course_id = :c AND mode <> 'recorded'").param("c", id).query(String.class).list());
        for (JsonNode o : b.path("offerings")) {
            String oid = o.path("id").asText("");
            if (mine.contains(oid) && o.has("sessions")) writer.saveSessions(oid, o.get("sessions"));
        }
        return Json.of(db.sql(COURSES + " WHERE c.id = :id").param("id", id).query(String.class).single());
    }

    @GetMapping("/sessions")
    public ResponseEntity<String> sessions(HttpServletRequest req) {
        String m = mentorId(req);
        return Json.array(db.sql("""
                SELECT json_build_object('id',s.id,'startsAt',s.starts_at,'durationMin',s.duration_min,'seats',s.seats,
                  'enrolled',s.seats_taken,'title',s.title,'courseSlug',c.slug,'courseTitle',c.title,'mode',o.mode)::text
                FROM live_sessions s JOIN offerings o ON o.id = s.offering_id JOIN courses c ON c.id = o.course_id
                WHERE c.mentor_id = :m AND s.starts_at > now() - interval '1 day' ORDER BY s.starts_at""").param("m", m).query(String.class).list());
    }

    /** Host link for a session, from the LiveVideo adapter. */
    @GetMapping("/sessions/{id}/join")
    public ResponseEntity<Map<String, String>> join(@PathVariable String id, HttpServletRequest req) {
        String m = mentorId(req);
        boolean own = db.sql("""
                SELECT count(*) FROM live_sessions s JOIN offerings o ON o.id = s.offering_id JOIN courses c ON c.id = o.course_id
                WHERE s.id = :s AND c.mentor_id = :m""").param("s", id).param("m", m).query(Integer.class).single() > 0;
        if (!own) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return ResponseEntity.ok(Map.of("url", live.joinLink(id, "mentor:" + m)));
    }

    /** Learners on the mentor's courses. Names and progress only: no emails or phone numbers. */
    @GetMapping("/learners")
    public ResponseEntity<String> learners(HttpServletRequest req) {
        String m = mentorId(req);
        return Json.array(db.sql("""
                SELECT json_build_object('name',u.full_name,'courseSlug',c.slug,'courseTitle',c.title,'mode',o.mode,
                  'progressPct',e.progress_pct,'enrolledAt',e.enrolled_at,'completed',e.certificate_code IS NOT NULL,
                  'guardian',u.registering_for = 'child')::text
                FROM enrollments e JOIN users u ON u.id = e.user_id JOIN offerings o ON o.id = e.offering_id JOIN courses c ON c.id = o.course_id
                WHERE c.mentor_id = :m ORDER BY e.enrolled_at DESC LIMIT 500""").param("m", m).query(String.class).list());
    }

    @GetMapping("/reviews")
    public ResponseEntity<String> reviews(HttpServletRequest req) {
        String m = mentorId(req);
        return Json.array(db.sql("""
                SELECT json_build_object('id',r.id,'courseSlug',c.slug,'courseTitle',c.title,'author',r.author,'rating',r.rating,
                  'comment',r.comment,'mentorReply',r.mentor_reply,'createdAt',r.created_at)::text
                FROM reviews r JOIN courses c ON c.id = r.course_id WHERE c.mentor_id = :m ORDER BY r.created_at DESC LIMIT 500""")
                .param("m", m).query(String.class).list());
    }

    /** Set or clear the reply on a review of an own course. Body {"ar","en"} or {} to clear. */
    @PutMapping("/reviews/{id}/reply")
    public ResponseEntity<Map<String, Boolean>> reply(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        String m = mentorId(req);
        String json = null;
        if (!b.path("ar").asText("").isBlank() || !b.path("en").asText("").isBlank()) {
            var o = new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
            String ar = b.path("ar").asText("").trim();
            String en = b.path("en").asText("").trim();
            o.put("ar", ar.isEmpty() ? en : ar);
            o.put("en", en.isEmpty() ? ar : en);
            json = o.toString();
        }
        int n = db.sql("UPDATE reviews r SET mentor_reply = :j::jsonb FROM courses c WHERE r.id = :id AND c.id = r.course_id AND c.mentor_id = :m")
                .param("j", json).param("id", id).param("m", m).update();
        if (n == 0) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
