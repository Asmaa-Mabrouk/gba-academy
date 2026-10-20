package sa.gba.academy.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.common.Json;

@RestController
@RequestMapping("/api/v1")
public class AuthController {
    public record RegisterRequest(@NotBlank String fullName, @NotBlank @Email String email, String mobile,
                                  @NotBlank String password, String locale, String registeringFor,
                                  boolean marketingConsent, boolean acceptedTerms, String termsVersion) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    private static final String USER_JSON = """
            SELECT json_build_object('id',id,'fullName',full_name,'email',email,'mobile',mobile,'locale',locale,
              'roles',roles,'registeringFor',registering_for)::text FROM users WHERE id = :id""";

    private final JdbcClient db;
    private final JwtService jwt;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(JdbcClient db, JwtService jwt) {
        this.db = db;
        this.jwt = jwt;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest r) {
        String pw = r.password();
        if (!r.acceptedTerms()) throw new ApiException(HttpStatus.BAD_REQUEST, "terms_required");
        if (pw.length() < 8 || !pw.matches(".*[A-Za-z\\u0600-\\u06FF].*") || !pw.matches(".*\\d.*"))
            throw new ApiException(HttpStatus.BAD_REQUEST, "weak_password");
        boolean exists = db.sql("SELECT count(*) FROM users WHERE lower(email) = lower(:e)")
                .param("e", r.email()).query(Integer.class).single() > 0;
        if (exists) throw new ApiException(HttpStatus.CONFLICT, "email_exists");
        UUID id = db.sql("""
                INSERT INTO users(email, password_hash, full_name, mobile, locale, registering_for, marketing_consent)
                VALUES (:e, :h, :n, :m, :l, :rf, :mc) RETURNING id""")
                .param("e", r.email().trim()).param("h", encoder.encode(pw)).param("n", r.fullName().trim())
                .param("m", r.mobile()).param("l", "en".equals(r.locale()) ? "en" : "ar")
                .param("rf", "child".equals(r.registeringFor()) ? "child" : "self").param("mc", r.marketingConsent())
                .query(UUID.class).single();
        String ver = r.termsVersion() == null || r.termsVersion().isBlank() ? "unknown" : r.termsVersion();
        for (String doc : List.of("terms", "privacy"))
            db.sql("INSERT INTO user_consents(user_id, document, version) VALUES (:u, :d, :v)").param("u", id).param("d", doc).param("v", ver).update();
        if (r.marketingConsent())
            db.sql("INSERT INTO user_consents(user_id, document, version) VALUES (:u, 'marketing', :v)").param("u", id).param("v", ver).update();
        return session(id);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<String> login(@Valid @RequestBody LoginRequest r) {
        List<Map<String, Object>> rows = db.sql("SELECT id, password_hash FROM users WHERE lower(email) = lower(:e)")
                .param("e", r.email()).query().listOfRows();
        if (rows.isEmpty() || !encoder.matches(r.password(), (String) rows.get(0).get("password_hash")))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
        return session((UUID) rows.get(0).get("id"));
    }

    @GetMapping("/me")
    public ResponseEntity<String> me(HttpServletRequest req) {
        UUID id = AuthInterceptor.require(req);
        return Json.of(db.sql(USER_JSON).param("id", id).query(String.class).single());
    }

    private ResponseEntity<String> session(UUID id) {
        String user = db.sql(USER_JSON).param("id", id).query(String.class).single();
        return Json.of("{\"token\":\"" + jwt.issue(id) + "\",\"user\":" + user + "}");
    }
}
