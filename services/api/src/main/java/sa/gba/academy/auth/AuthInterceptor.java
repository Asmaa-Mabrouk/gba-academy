package sa.gba.academy.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import sa.gba.academy.common.ApiException;

/** Reads "Authorization: Bearer <jwt>" and exposes the user id. Controllers call {@link #require}. */
@Component
public class AuthInterceptor implements HandlerInterceptor {
    private static final String ATTR = "gba.userId";
    private final JwtService jwt;

    public AuthInterceptor(JwtService jwt) { this.jwt = jwt; }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) jwt.parse(h.substring(7)).ifPresent(id -> req.setAttribute(ATTR, id));
        return true;
    }

    public static UUID require(HttpServletRequest req) {
        Object id = req.getAttribute(ATTR);
        if (id == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "unauthorized");
        return (UUID) id;
    }
}
