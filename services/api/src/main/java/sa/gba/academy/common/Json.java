package sa.gba.academy.common;

import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/** Several read endpoints let PostgreSQL build the JSON; this wraps the raw text as a response. */
public final class Json {
    private Json() {}

    public static ResponseEntity<String> of(String json) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(json);
    }

    public static ResponseEntity<String> array(List<String> items) {
        return of("[" + String.join(",", items) + "]");
    }
}
