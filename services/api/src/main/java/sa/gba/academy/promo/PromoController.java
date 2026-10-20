package sa.gba.academy.promo;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.auth.AuthInterceptor;
import sa.gba.academy.auth.Roles;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.common.Json;

/** Promo codes: admin management, and the learner's "apply code" check in the cart. */
@RestController
@RequestMapping("/api/v1")
public class PromoController {
    private static final String SELECT = """
            SELECT json_build_object('id',p.id,'code',p.code,'percentOff',p.percent_off,'maxUses',p.max_uses,'usedCount',p.used_count,
              'expiresAt',p.expires_at,'active',p.active,'note',p.note,'createdAt',p.created_at,
              'expired',(p.expires_at IS NOT NULL AND p.expires_at < now()))::text
            FROM promo_codes p""";

    private final JdbcClient db;
    private final Roles roles;
    private final PromoService promos;

    public PromoController(JdbcClient db, Roles roles, PromoService promos) {
        this.db = db;
        this.roles = roles;
        this.promos = promos;
    }

    @GetMapping("/admin/promos")
    public ResponseEntity<String> list(HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.array(db.sql(SELECT + " ORDER BY p.created_at DESC").query(String.class).list());
    }

    @PostMapping("/admin/promos")
    public ResponseEntity<String> create(@RequestBody JsonNode b, HttpServletRequest req) {
        UUID admin = roles.require(req, "admin");
        String code = PromoService.normalize(b.path("code").asText(""));
        if (!code.matches("[A-Z0-9_-]{3,32}")) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_code");
        if (db.sql("SELECT count(*) FROM promo_codes WHERE code = :c").param("c", code).query(Integer.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "code_exists");
        UUID id = db.sql("""
                INSERT INTO promo_codes(code, percent_off, max_uses, expires_at, active, note, created_by)
                VALUES (:c, :p, :m, :e::timestamptz, :a, :n, :u) RETURNING id""")
                .param("c", code).param("p", percent(b)).param("m", maxUses(b)).param("e", expires(b))
                .param("a", b.path("active").asBoolean(true)).param("n", note(b)).param("u", admin).query(UUID.class).single();
        return Json.of(one(id));
    }

    /** The code itself never changes (printed codes stay valid); everything else can. */
    @PutMapping("/admin/promos/{id}")
    public ResponseEntity<String> update(@PathVariable UUID id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        List<Integer> used = db.sql("SELECT used_count FROM promo_codes WHERE id = :id").param("id", id).query(Integer.class).list();
        if (used.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        Integer max = maxUses(b);
        if (max != null && max < used.get(0)) throw new ApiException(HttpStatus.BAD_REQUEST, "max_uses_below_used");
        db.sql("UPDATE promo_codes SET percent_off = :p, max_uses = :m, expires_at = :e::timestamptz, active = :a, note = :n WHERE id = :id")
                .param("p", percent(b)).param("m", max).param("e", expires(b)).param("a", b.path("active").asBoolean(true))
                .param("n", note(b)).param("id", id).update();
        return Json.of(one(id));
    }

    /** A code that was used stays for the records: deactivate it instead. */
    @DeleteMapping("/admin/promos/{id}")
    public ResponseEntity<Map<String, Boolean>> delete(@PathVariable UUID id, HttpServletRequest req) {
        roles.require(req, "admin");
        List<Integer> used = db.sql("SELECT used_count FROM promo_codes WHERE id = :id").param("id", id).query(Integer.class).list();
        if (used.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        if (used.get(0) > 0) throw new ApiException(HttpStatus.CONFLICT, "promo_in_use");
        db.sql("DELETE FROM promo_codes WHERE id = :id").param("id", id).update();
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** Cart: what would this code take off these offerings? Nothing is recorded until the order is placed. */
    @PostMapping("/promo/validate")
    public ResponseEntity<Map<String, Object>> validate(@RequestBody JsonNode b, HttpServletRequest req) {
        UUID user = AuthInterceptor.require(req);
        long gross = 0;
        for (JsonNode o : b.path("offeringIds")) {
            List<Long> price = db.sql("SELECT price_halalas FROM offerings WHERE id = :id").param("id", o.asText("")).query(Long.class).list();
            if (price.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "unknown_offering");
            gross += price.get(0);
        }
        PromoService.Quote q = promos.quote(b.path("code").asText(""), user, gross, false);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("code", q.code());
        out.put("percentOff", q.percentOff());
        out.put("grossHalalas", gross);
        out.put("discountHalalas", q.discountHalalas());
        out.put("totalHalalas", gross - q.discountHalalas());
        return ResponseEntity.ok(out);
    }

    // ---------------------------------------------------------------------------------------------

    private String one(UUID id) { return db.sql(SELECT + " WHERE p.id = :id").param("id", id).query(String.class).single(); }

    private static int percent(JsonNode b) {
        int p = b.path("percentOff").asInt(0);
        if (p < 1 || p > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_percent");
        return p;
    }

    private static Integer maxUses(JsonNode b) {
        if (!b.hasNonNull("maxUses") || b.get("maxUses").asText("").isBlank()) return null;
        int m = b.get("maxUses").asInt(0);
        if (m < 1) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_max_uses");
        return m;
    }

    private static String expires(JsonNode b) {
        String e = b.hasNonNull("expiresAt") ? b.get("expiresAt").asText("").trim() : "";
        if (e.isEmpty()) return null;
        try { OffsetDateTime.parse(e); } catch (DateTimeParseException ex) { throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_expiry"); }
        return e;
    }

    private static String note(JsonNode b) {
        String n = b.hasNonNull("note") ? b.get("note").asText("").trim() : "";
        return n.isEmpty() ? null : (n.length() > 300 ? n.substring(0, 300) : n);
    }
}
