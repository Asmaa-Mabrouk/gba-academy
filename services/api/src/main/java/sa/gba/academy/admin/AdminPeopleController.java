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
import sa.gba.academy.common.ApiException;
import sa.gba.academy.common.Json;

/** Admin: mentor profiles (linked to a login account) and user roles. */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminPeopleController {
    private static final Set<String> ALL_ROLES = Set.of("learner", "mentor", "admin");
    private static final String MENTOR_SELECT = """
            SELECT json_build_object('id',m.id,'slug',m.slug,'name',m.name,'title',m.title,'bio',m.bio,
              'expertise',m.expertise,'languages',m.languages,'rating',m.rating,'reviewCount',m.review_count,
              'courseCount',(SELECT count(*) FROM courses c WHERE c.mentor_id = m.id),'learners',m.learners,'hue',m.hue,
              'userId',m.user_id,'userEmail',u.email)::text
            FROM mentors m LEFT JOIN users u ON u.id = m.user_id""";

    private final JdbcClient db;
    private final Roles roles;

    public AdminPeopleController(JdbcClient db, Roles roles) {
        this.db = db;
        this.roles = roles;
    }

    @GetMapping("/mentors")
    public ResponseEntity<String> mentors(HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.array(db.sql(MENTOR_SELECT + " ORDER BY m.name ->> 'ar'").query(String.class).list());
    }

    @PostMapping("/mentors")
    @Transactional
    public ResponseEntity<String> createMentor(@RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        String slug = text(b, "slug");
        if (!slug.matches("[a-z0-9]+(-[a-z0-9]+)*")) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_slug");
        String id = "m-" + slug;
        if (db.sql("SELECT count(*) FROM mentors WHERE id = :i OR slug = :s").param("i", id).param("s", slug).query(Integer.class).single() > 0)
            throw new ApiException(HttpStatus.CONFLICT, "slug_exists");
        return Json.of(saveMentor(id, b));
    }

    @PutMapping("/mentors/{id}")
    @Transactional
    public ResponseEntity<String> updateMentor(@PathVariable String id, @RequestBody JsonNode b, HttpServletRequest req) {
        roles.require(req, "admin");
        if (db.sql("SELECT count(*) FROM mentors WHERE id = :i").param("i", id).query(Integer.class).single() == 0)
            throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return Json.of(saveMentor(id, b));
    }

    private String saveMentor(String id, JsonNode b) {
        UUID userId = null;
        String email = b.path("userEmail").asText("").trim();
        if (!email.isEmpty()) {
            List<UUID> u = db.sql("SELECT id FROM users WHERE lower(email) = lower(:e)").param("e", email).query(UUID.class).list();
            if (u.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "user_not_found");
            userId = u.get(0);
            // one account can be linked to only one mentor profile
            db.sql("UPDATE mentors SET user_id = NULL WHERE user_id = :u AND id <> :id").param("u", userId).param("id", id).update();
        }
        db.sql("""
                INSERT INTO mentors(id, slug, name, title, bio, expertise, languages, hue, user_id)
                VALUES (:id, :slug, :name::jsonb, :title::jsonb, :bio::jsonb, string_to_array(:exp, ','), string_to_array(:langs, ','), :hue, :u)
                ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name, title = EXCLUDED.title, bio = EXCLUDED.bio,
                  expertise = EXCLUDED.expertise, languages = EXCLUDED.languages, hue = EXCLUDED.hue, user_id = EXCLUDED.user_id""")
                .param("id", id).param("slug", text(b, "slug")).param("name", bilingual(b, "name")).param("title", bilingual(b, "title"))
                .param("bio", bilingual(b, "bio")).param("exp", join(b.path("expertise"), null))
                .param("langs", join(b.path("languages"), Set.of("ar", "en"))).param("hue", b.path("hue").asInt(40)).param("u", userId).update();
        if (userId != null)
            db.sql("UPDATE users SET roles = array_append(roles, 'mentor') WHERE id = :u AND NOT ('mentor' = ANY(roles))").param("u", userId).update();
        return db.sql(MENTOR_SELECT + " WHERE m.id = :id").param("id", id).query(String.class).single();
    }

    @GetMapping("/users")
    public ResponseEntity<String> users(HttpServletRequest req) {
        roles.require(req, "admin");
        return Json.array(db.sql("""
                SELECT json_build_object('id',id,'fullName',full_name,'email',email,'mobile',mobile,'roles',roles,
                  'registeringFor',registering_for,'createdAt',created_at,
                  'enrollments',(SELECT count(*) FROM enrollments e WHERE e.user_id = users.id))::text
                FROM users ORDER BY created_at DESC LIMIT 500""").query(String.class).list());
    }

    @PutMapping("/users/{id}/roles")
    public ResponseEntity<String> setRoles(@PathVariable UUID id, @RequestBody JsonNode b, HttpServletRequest req) {
        UUID me = roles.require(req, "admin");
        List<String> r = new ArrayList<>();
        for (JsonNode n : b.path("roles")) if (ALL_ROLES.contains(n.asText()) && !r.contains(n.asText())) r.add(n.asText());
        if (!r.contains("learner")) r.add("learner"); // everyone can learn
        if (me.equals(id) && !r.contains("admin")) throw new ApiException(HttpStatus.BAD_REQUEST, "cannot_remove_own_admin");
        int n = db.sql("UPDATE users SET roles = string_to_array(:r, ',') WHERE id = :id").param("r", String.join(",", r)).param("id", id).update();
        if (n == 0) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        return Json.of(db.sql("SELECT json_build_object('id',id,'roles',roles)::text FROM users WHERE id = :id").param("id", id).query(String.class).single());
    }

    private static String text(JsonNode n, String f) {
        String v = n.path(f).asText("").trim();
        if (v.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_" + f);
        return v;
    }

    private static String bilingual(JsonNode n, String f) {
        String ar = n.path(f).path("ar").asText("").trim();
        String en = n.path(f).path("en").asText("").trim();
        if (ar.isEmpty() && en.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_" + f);
        var o = new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
        o.put("ar", ar.isEmpty() ? en : ar);
        o.put("en", en.isEmpty() ? ar : en);
        return o.toString();
    }

    private static String join(JsonNode arr, Set<String> allowed) {
        List<String> out = new ArrayList<>();
        for (JsonNode n : arr) {
            String v = n.asText("").trim().replace(",", " ");
            if (!v.isEmpty() && (allowed == null || allowed.contains(v))) out.add(v);
        }
        return String.join(",", out);
    }
}
