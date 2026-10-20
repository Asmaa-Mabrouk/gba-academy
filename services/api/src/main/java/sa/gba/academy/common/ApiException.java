package sa.gba.academy.common;

import org.springframework.http.HttpStatus;

/** Thrown for expected failures. The web app maps `code` to a translated message. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code) {
        super(code);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }
}
