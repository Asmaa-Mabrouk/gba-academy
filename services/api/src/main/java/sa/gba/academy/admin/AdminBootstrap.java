package sa.gba.academy.admin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import sa.gba.academy.config.AppProperties;

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (or grants the role if the account already exists). */
@Component
public class AdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    private final JdbcClient db;
    private final AppProperties props;

    public AdminBootstrap(JdbcClient db, AppProperties props) {
        this.db = db;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        String email = props.adminEmail();
        if (email == null || email.isBlank()) return;
        int existing = db.sql("UPDATE users SET roles = array_append(roles, 'admin') WHERE lower(email) = lower(:e) AND NOT ('admin' = ANY(roles))")
                .param("e", email).update();
        boolean exists = db.sql("SELECT count(*) FROM users WHERE lower(email) = lower(:e)").param("e", email).query(Integer.class).single() > 0;
        if (!exists) {
            String pw = props.adminPassword();
            if (pw == null || pw.length() < 8) {
                log.warn("ADMIN_EMAIL is set but ADMIN_PASSWORD is missing or shorter than 8 characters; admin not created");
                return;
            }
            db.sql("INSERT INTO users(email, password_hash, full_name, roles) VALUES (:e, :h, 'Administrator', ARRAY['admin','learner'])")
                    .param("e", email.trim()).param("h", new BCryptPasswordEncoder().encode(pw)).update();
            log.info("Created admin account {}", email);
        } else if (existing > 0) {
            log.info("Granted admin role to {}", email);
        }
    }
}
