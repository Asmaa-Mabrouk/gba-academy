package sa.gba.academy.catalog;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.common.Json;

/** Public, read-only catalogue. PostgreSQL assembles the JSON so the shape matches apps/web/src/lib/types.ts. */
@RestController
@RequestMapping("/api/v1")
public class CatalogController {
    static final String COURSE_JSON = """
            json_build_object(
              'id',c.id,'slug',c.slug,'audience',c.audience,'level',c.level,'topic',c.topic,
              'title',c.title,'subtitle',c.subtitle,'description',c.description,'outcomes',c.outcomes,'modules',c.modules,
              'mentorId',c.mentor_id,'rating',c.rating,'reviewCount',c.review_count,'learners',c.learners,'hours',c.hours,
              'languages',c.languages,'featured',c.featured,'isNew',c.is_new,'bestseller',c.bestseller,
              'ageRange',c.age_range,'certificate',c.certificate,'cpdPoints',c.cpd_points,'published',c.published,
              'offerings',(SELECT coalesce(json_agg(json_build_object(
                  'id',o.id,'mode',o.mode,'priceHalalas',o.price_halalas,'compareAtHalalas',o.compare_at_halalas,
                  'accessDays',o.access_days,'cohortLabel',o.cohort_label,
                  'sessions',(SELECT coalesce(json_agg(json_build_object('id',s.id,'startsAt',s.starts_at,
                       'durationMin',s.duration_min,'seats',s.seats,'seatsLeft',s.seats - s.seats_taken,'title',s.title)
                       ORDER BY s.starts_at),'[]'::json) FROM live_sessions s WHERE s.offering_id = o.id)
                ) ORDER BY o.price_halalas),'[]'::json) FROM offerings o WHERE o.course_id = c.id)
            )::text""";

    private final JdbcClient db;

    public CatalogController(JdbcClient db) { this.db = db; }

    @GetMapping("/courses")
    public ResponseEntity<String> courses(@RequestParam(required = false) String q,
                                          @RequestParam(required = false) String audience,
                                          @RequestParam(required = false) String level,
                                          @RequestParam(required = false) String topic,
                                          @RequestParam(required = false) String mode,
                                          @RequestParam(required = false) Boolean freeOnly,
                                          @RequestParam(required = false, defaultValue = "popular") String sort) {
        String minPrice = "(SELECT min(price_halalas) FROM offerings WHERE course_id = c.id)";
        // ORDER BY comes from a fixed whitelist, never from user text.
        String order = switch (sort) {
            case "rating" -> "c.rating DESC";
            case "newest" -> "c.is_new DESC, c.learners DESC";
            case "priceAsc" -> minPrice + " ASC";
            case "priceDesc" -> minPrice + " DESC";
            default -> "c.learners DESC";
        };
        String sql = "SELECT " + COURSE_JSON + " FROM courses c WHERE c.published"
                + " AND (:aud::text IS NULL OR c.audience = :aud)"
                + " AND (:lvl::text IS NULL OR c.level = :lvl)"
                + " AND (:top::text IS NULL OR c.topic = :top)"
                + " AND (:mode::text IS NULL OR EXISTS (SELECT 1 FROM offerings o WHERE o.course_id = c.id AND o.mode = :mode))"
                + " AND (:free::boolean IS NOT TRUE OR " + minPrice + " = 0)"
                + " AND (:q::text IS NULL OR c.title::text ILIKE '%' || :q || '%' OR c.subtitle::text ILIKE '%' || :q || '%')"
                + " ORDER BY " + order;
        List<String> rows = db.sql(sql).param("aud", blank(audience)).param("lvl", blank(level)).param("top", blank(topic))
                .param("mode", blank(mode)).param("free", freeOnly).param("q", blank(q)).query(String.class).list();
        return Json.array(rows);
    }

    @GetMapping("/courses/{slug}")
    public ResponseEntity<String> course(@PathVariable String slug) {
        List<String> r = db.sql("SELECT " + COURSE_JSON + " FROM courses c WHERE c.slug = :s AND c.published").param("s", slug).query(String.class).list();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return Json.of(r.get(0));
    }

    private static final String MENTOR_JSON = """
            SELECT json_build_object('id',m.id,'slug',m.slug,'name',m.name,'title',m.title,'bio',m.bio,
              'expertise',m.expertise,'languages',m.languages,'rating',m.rating,'reviewCount',m.review_count,
              'courseCount',(SELECT count(*) FROM courses c WHERE c.mentor_id = m.id),'learners',m.learners,'hue',m.hue)::text
            FROM mentors m""";

    @GetMapping("/mentors")
    public ResponseEntity<String> mentors() {
        return Json.array(db.sql(MENTOR_JSON + " ORDER BY m.rating DESC").query(String.class).list());
    }

    @GetMapping("/mentors/{slug}")
    public ResponseEntity<String> mentor(@PathVariable String slug) {
        List<String> r = db.sql(MENTOR_JSON + " WHERE m.slug = :s").param("s", slug).query(String.class).list();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return Json.of(r.get(0));
    }

    @GetMapping("/courses/{slug}/reviews")
    public ResponseEntity<String> reviews(@PathVariable String slug) {
        return Json.array(db.sql("""
                SELECT json_build_object('id',r.id,'courseSlug',c.slug,'author',r.author,'rating',r.rating,
                  'comment',r.comment,'createdAt',r.created_at,'mentorReply',r.mentor_reply)::text
                FROM reviews r JOIN courses c ON c.id = r.course_id WHERE c.slug = :s ORDER BY r.created_at DESC""")
                .param("s", slug).query(String.class).list());
    }

    private static String blank(String s) { return s == null || s.isBlank() || "all".equals(s) ? null : s; }
}
