package sa.gba.academy.admin;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
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
import sa.gba.academy.common.Json;

/**
 * Admin: manage courses with their offerings and live sessions in one call.
 * The body has the same shape as GET /courses/{slug} (apps/web/src/lib/types.ts, `Course`).
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminCourseController {
    private static final Set<String> AUDIENCES = Set.of("kids", "youth", "experts");
    private static final Set<String> LEVELS = Set.of("beginner", "intermediate", "advanced");
    private static final Set<String> MODES = Set.of("recorded", "live", "blended");
    private static final String SELECT = "SELECT " + CatalogController.COURSE_JSON + " FROM courses c";

    private final JdbcClient db;
    private final Roles roles;

    public AdminCourseController(JdbcClient db, Roles roles) {
        this.db = db;
        this.roles = roles;
    }

    @GetMapping("/courses")
    public ResponseEntity<String> list(HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.array(db.sql(SELECT + " ORDER BY c.audience, c.title ->> 'ar'").query(String.class).list());
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<String> one(@PathVariable String id, HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.of(load(id));
    }

    @PostMapping("/courses")
    @Transactional
    public ResponseEntity<String> create(@RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        String slug = text(b, "slug");
        String id = "c-" + slug;
        if (db.sql("SELECT count(*) FROM courses WHERE id = :id OR slug = :s").param("id", id).param("s", slug).query(Integer.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "slug_exists");
        return Json.of(save(id, b));
    }

    @PutMapping("/courses/{id}")
    @Transactional
    public ResponseEntity<String> update(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        load(id); // 404 if missing
        return Json.of(save(id, b));
    }

    @PutMapping("/courses/{id}/published")
    public ResponseEntity<String> publish(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        db.sql("UPDATE courses SET published = :p WHERE id = :id").param("p", b.path("published").asBoolean(false)).param("id", id).update();
        return Json.of(load(id));
    }

    // ---------------------------------------------------------------------------------------------

    private String load(String id) {
        List<String> r = db.sql(SELECT + " WHERE c.id = :id").param("id", id).query(String.class).list();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return r.get(0);
    }

    private String save(String id, JsonNode b) {
        String slug = text(b, "slug");
        if (!slug.matches("[a-z0-9]+(-[a-z0-9]+)*")) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_slug");
        String audience = oneOf(b, "audience", AUDIENCES);
        String level = oneOf(b, "level", LEVELS);
        String mentorId = text(b, "mentorId");
        if (db.sql("SELECT count(*) FROM mentors WHERE id = :m").param("m", mentorId).query(Integer.class).single() == 0)
            throw new ApiException(HttpStatus.BAD_REQUEST, "unknown_mentor");
        List<String> langs = new ArrayList<>();
        for (JsonNode l : b.path("languages")) if ("ar".equals(l.asText()) || "en".equals(l.asText())) langs.add(l.asText());
        if (langs.isEmpty()) langs.add("ar");

        db.sql("""
                INSERT INTO courses(id, slug, audience, level, topic, title, subtitle, description, outcomes, modules, mentor_id,
                  hours, languages, featured, is_new, bestseller, age_range, certificate, cpd_points, published)
                VALUES (:id, :slug, :aud, :lvl, :topic, :title::jsonb, :sub::jsonb, :descr::jsonb, :outc::jsonb, :modl::jsonb, :mentor,
                  :hours, string_to_array(:langs, ','), :feat, :isnew, :best, :age, :cert, :cpd, :pub)
                ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, audience = EXCLUDED.audience, level = EXCLUDED.level,
                  topic = EXCLUDED.topic, title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
                  outcomes = EXCLUDED.outcomes, modules = EXCLUDED.modules, mentor_id = EXCLUDED.mentor_id, hours = EXCLUDED.hours,
                  languages = EXCLUDED.languages, featured = EXCLUDED.featured, is_new = EXCLUDED.is_new,
                  bestseller = EXCLUDED.bestseller, age_range = EXCLUDED.age_range, certificate = EXCLUDED.certificate,
                  cpd_points = EXCLUDED.cpd_points, published = EXCLUDED.published""")
                .param("id", id).param("slug", slug).param("aud", audience).param("lvl", level)
                .param("topic", text(b, "topic")).param("title", bilingual(b, "title", true))
                .param("sub", bilingual(b, "subtitle", false)).param("descr", bilingual(b, "description", false))
                .param("outc", array(b, "outcomes")).param("modl", modules(b.path("modules")))
                .param("mentor", mentorId).param("hours", b.path("hours").asInt(0)).param("langs", String.join(",", langs))
                .param("feat", b.path("featured").asBoolean(false)).param("isnew", b.path("isNew").asBoolean(false))
                .param("best", b.path("bestseller").asBoolean(false))
                .param("age", b.hasNonNull("ageRange") && !b.get("ageRange").asText().isBlank() ? b.get("ageRange").asText() : null)
                .param("cert", b.path("certificate").asBoolean(true))
                .param("cpd", b.hasNonNull("cpdPoints") ? b.get("cpdPoints").asInt() : null)
                .param("pub", b.path("published").asBoolean(true)).update();

        saveOfferings(id, slug, b.path("offerings"));
        return load(id);
    }

    private void saveOfferings(String courseId, String slug, JsonNode offerings) {
        List<String> keep = new ArrayList<>();
        for (JsonNode o : offerings) {
            String mode = oneOf(o, "mode", MODES);
            String oid = o.hasNonNull("id") && !o.get("id").asText().isBlank() ? o.get("id").asText() : slug + "-" + mode;
            long price = o.path("priceHalalas").asLong(-1);
            if (price < 0) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_price");
            keep.add(oid);
            db.sql("""
                    INSERT INTO offerings(id, course_id, mode, price_halalas, compare_at_halalas, access_days, cohort_label)
                    VALUES (:id, :c, :m, :p, :cmp, :acc, :coh::jsonb)
                    ON CONFLICT (id) DO UPDATE SET mode = EXCLUDED.mode, price_halalas = EXCLUDED.price_halalas,
                      compare_at_halalas = EXCLUDED.compare_at_halalas, access_days = EXCLUDED.access_days, cohort_label = EXCLUDED.cohort_label
                    WHERE offerings.course_id = EXCLUDED.course_id""")
                    .param("id", oid).param("c", courseId).param("m", mode).param("p", price)
                    .param("cmp", o.hasNonNull("compareAtHalalas") ? o.get("compareAtHalalas").asLong() : null)
                    .param("acc", o.hasNonNull("accessDays") ? o.get("accessDays").asInt() : null)
                    .param("coh", o.hasNonNull("cohortLabel") ? o.get("cohortLabel").toString() : null).update();
            saveSessions(oid, o.path("sessions"));
        }
        // Remove offerings that were dropped, unless somebody already bought them.
        List<String> existing = db.sql("SELECT id FROM offerings WHERE course_id = :c").param("c", courseId).query(String.class).list();
        for (String oid : existing) {
            if (keep.contains(oid)) continue;
            boolean used = db.sql("SELECT (SELECT count(*) FROM order_lines WHERE offering_id = :o) + (SELECT count(*) FROM enrollments WHERE offering_id = :o)")
                    .param("o", oid).query(Integer.class).single() > 0;
            if (used) throw new ApiException(HttpStatus.CONFLICT, "offering_in_use");
            db.sql("DELETE FROM live_sessions WHERE offering_id = :o").param("o", oid).update();
            db.sql("DELETE FROM offerings WHERE id = :o").param("o", oid).update();
        }
    }

    private void saveSessions(String offeringId, JsonNode sessions) {
        List<String> keep = new ArrayList<>();
        for (JsonNode s : sessions) {
            String sid = s.hasNonNull("id") && !s.get("id").asText().isBlank() ? s.get("id").asText() : "s-" + UUID.randomUUID();
            int seats = s.path("seats").asInt(0);
            if (seats <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_seats");
            keep.add(sid);
            db.sql("""
                    INSERT INTO live_sessions(id, offering_id, starts_at, duration_min, seats, title)
                    VALUES (:id, :o, :at::timestamptz, :d, :seats, :t::jsonb)
                    ON CONFLICT (id) DO UPDATE SET starts_at = EXCLUDED.starts_at, duration_min = EXCLUDED.duration_min,
                      seats = EXCLUDED.seats, title = EXCLUDED.title WHERE live_sessions.offering_id = EXCLUDED.offering_id""")
                    .param("id", sid).param("o", offeringId).param("at", text(s, "startsAt")).param("d", s.path("durationMin").asInt(60))
                    .param("seats", seats).param("t", bilingual(s, "title", false)).update();
        }
        db.sql("DELETE FROM live_sessions WHERE offering_id = :o AND id <> ALL(string_to_array(:ids, ','))")
                .param("o", offeringId).param("ids", String.join(",", keep)).update();
    }

    /** Make sure every module and lesson has a stable id, so learner progress keeps pointing at the right lessons. */
    private String modules(JsonNode modules) {
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        var out = mapper.createArrayNode();
        int mi = 0;
        for (JsonNode m : modules) {
            mi++;
            var mo = mapper.createObjectNode();
            mo.put("id", m.hasNonNull("id") && !m.get("id").asText().isBlank() ? m.get("id").asText() : "m" + mi + "-" + UUID.randomUUID().toString().substring(0, 4));
            mo.set("title", m.path("title"));
            var ls = mo.putArray("lessons");
            for (JsonNode l : m.path("lessons")) {
                var lo = mapper.createObjectNode();
                lo.put("id", l.hasNonNull("id") && !l.get("id").asText().isBlank() ? l.get("id").asText() : "l-" + UUID.randomUUID().toString().substring(0, 8));
                lo.set("title", l.path("title"));
                lo.put("minutes", l.path("minutes").asInt(0));
                String kind = l.path("kind").asText("video");
                lo.put("kind", Set.of("video", "live", "quiz", "resource").contains(kind) ? kind : "video");
                lo.put("preview", l.path("preview").asBoolean(false));
                ls.add(lo);
            }
            out.add(mo);
        }
        return out.toString();
    }

    private static String text(JsonNode n, String f) {
        String v = n.path(f).asText("").trim();
        if (v.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_" + f);
        return v;
    }

    private static String oneOf(JsonNode n, String f, Set<String> allowed) {
        String v = n.path(f).asText("");
        if (!allowed.contains(v)) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_" + f);
        return v;
    }

    private static String array(JsonNode n, String f) { return n.path(f).isArray() ? n.get(f).toString() : "[]"; }

    /** {ar,en}. Arabic is required when `required`; a missing language falls back to the other. */
    private static String bilingual(JsonNode n, String f, boolean required) {
        String ar = n.path(f).path("ar").asText("").trim();
        String en = n.path(f).path("en").asText("").trim();
        if (required && ar.isEmpty() && en.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_" + f);
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        var o = mapper.createObjectNode();
        o.put("ar", ar.isEmpty() ? en : ar);
        o.put("en", en.isEmpty() ? ar : en);
        return o.toString();
    }
}
