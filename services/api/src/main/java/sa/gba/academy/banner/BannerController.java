package sa.gba.academy.banner;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.auth.Roles;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.common.Json;

/** Announcement banners: a public list of what is live now, and admin management. */
@RestController
@RequestMapping("/api/v1")
public class BannerController {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String SELECT = """
            SELECT json_build_object('id',b.id,'title',b.title,'subtitle',b.subtitle,'ctaLabel',b.cta_label,'linkUrl',b.link_url,
              'imageUrl',b.image_url,'theme',b.theme,'startsAt',b.starts_at,'endsAt',b.ends_at,'active',b.active,'sortOrder',b.sort_order,
              'live',(b.active AND (b.starts_at IS NULL OR b.starts_at <= now()) AND (b.ends_at IS NULL OR b.ends_at > now())))::text
            FROM banners b""";

    private final JdbcClient db;
    private final Roles roles;

    public BannerController(JdbcClient db, Roles roles) {
        this.db = db;
        this.roles = roles;
    }

    /** Public: only banners that are active and inside their dates. */
    @GetMapping("/banners")
    public ResponseEntity<String> live() {
        return Json.array(db.sql(SELECT + """
                 WHERE b.active AND (b.starts_at IS NULL OR b.starts_at <= now()) AND (b.ends_at IS NULL OR b.ends_at > now())
                 ORDER BY b.sort_order, b.created_at""").query(String.class).list());
    }

    @GetMapping("/admin/banners")
    public ResponseEntity<String> list(HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.array(db.sql(SELECT + " ORDER BY b.sort_order, b.created_at").query(String.class).list());
    }

    @PostMapping("/admin/banners")
    public ResponseEntity<String> create(@RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        UUID id = db.sql("""
                INSERT INTO banners(title, subtitle, cta_label, link_url, image_url, theme, starts_at, ends_at, active, sort_order)
                VALUES (:t::jsonb, :s::jsonb, :c::jsonb, :l, :i, :th, :st::timestamptz, :en::timestamptz, :a, :o) RETURNING id""")
                .paramSource(params(b)).query(UUID.class).single();
        return Json.of(one(id));
    }

    @PutMapping("/admin/banners/{id}")
    public ResponseEntity<String> update(@PathVariable UUID id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        int n = db.sql("""
                UPDATE banners SET title = :t::jsonb, subtitle = :s::jsonb, cta_label = :c::jsonb, link_url = :l, image_url = :i, theme = :th,
                  starts_at = :st::timestamptz, ends_at = :en::timestamptz, active = :a, sort_order = :o WHERE id = :id""")
                .paramSource(params(b)).param("id", id).update();
        if (n == 0) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return Json.of(one(id));
    }

    @DeleteMapping("/admin/banners/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, HttpServletRequest req) {
        roles.require(req, "admin");
        db.sql("DELETE FROM banners WHERE id = :id").param("id", id).update();
        return ResponseEntity.noContent().build();
    }

    private String one(UUID id) {
        return db.sql(SELECT + " WHERE b.id = :id").param("id", id).query(String.class).single();
    }

    private org.springframework.jdbc.core.namedparam.MapSqlParameterSource params(JsonNode b) {
        return new org.springframework.jdbc.core.namedparam.MapSqlParameterSource()
                .addValue("t", bilingual(b, "title", true)).addValue("s", bilingual(b, "subtitle", false)).addValue("c", bilingual(b, "ctaLabel", false))
                .addValue("l", link(b)).addValue("i", image(b)).addValue("th", theme(b))
                .addValue("st", date(b, "startsAt")).addValue("en", date(b, "endsAt"))
                .addValue("a", b.path("active").asBoolean(true)).addValue("o", b.path("sortOrder").asInt(0));
    }

    private static String bilingual(JsonNode b, String f, boolean required) {
        String ar = b.path(f).path("ar").asText("").trim();
        String en = b.path(f).path("en").asText("").trim();
        if (required && ar.isEmpty() && en.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_" + f);
        var o = MAPPER.createObjectNode();
        o.put("ar", ar.isEmpty() ? en : ar);
        o.put("en", en.isEmpty() ? ar : en);
        return o.toString();
    }

    /** An https link (for example the GPMF website) or a path inside this site. */
    private static String link(JsonNode b) {
        String u = b.path("linkUrl").asText("").trim();
        if (u.isEmpty()) return null;
        if (!u.matches("https://\\S+") && !u.matches("/\\S*")) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_link");
        return u;
    }

    private static String image(JsonNode b) {
        String u = b.path("imageUrl").asText("").trim();
        if (u.isEmpty()) return null;
        if (!u.startsWith("/api/v1/files/") && !u.matches("https://\\S+")) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_image_url");
        return u;
    }

    private static String theme(JsonNode b) {
        String t = b.path("theme").asText("navy");
        if (!java.util.Set.of("navy", "gold", "teal", "violet").contains(t)) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_theme");
        return t;
    }

    private static String date(JsonNode b, String f) {
        String v = b.path(f).asText("").trim();
        if (v.isEmpty()) return null;
        try {
            return OffsetDateTime.parse(v).toString();
        } catch (DateTimeParseException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_" + f);
        }
    }
}
