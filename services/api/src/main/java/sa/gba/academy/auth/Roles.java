package sa.gba.academy.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import sa.gba.academy.common.ApiException;

/**
 * One login, several interfaces: a user's `roles` (learner, mentor, admin) decide what they may call.
 * Roles are read from the database on each call, so a role change applies immediately.
 */
@Component
public class Roles {
    private final JdbcClient db;

    public Roles(JdbcClient db) { this.db = db; }

    /** @return the user id, or throws 401 (not signed in) / 403 (missing role). */
    public UUID require(HttpServletRequest req, String role) {
        UUID id = AuthInterceptor.require(req);
        boolean ok = db.sql("SELECT count(*) FROM users WHERE id = :id AND :r = ANY(roles)")
                .param("id", id).param("r", role).query(Integer.class).single() > 0;
        if (!ok) throw new ApiException(HttpStatus.FORBIDDEN, "forbidden");
        return id;
    }
}
