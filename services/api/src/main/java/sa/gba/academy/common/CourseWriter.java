package sa.gba.academy.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/** Shared writing rules for course content, used by the admin and mentor portals. */
@Service
public class CourseWriter {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final JdbcClient db;

    public CourseWriter(JdbcClient db) { this.db = db; }

    /** Upsert the live sessions of one offering; sessions missing from the list are deleted. Seats taken are preserved. */
    public void saveSessions(String offeringId, JsonNode sessions) {
        List<String> keep = new ArrayList<>();
        for (JsonNode s : sessions) {
            String sid = s.hasNonNull("id") && !s.get("id").asText().isBlank() ? s.get("id").asText() : "s-" + UUID.randomUUID();
            int seats = s.path("seats").asInt(0);
            if (seats <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_seats");
            List<Integer> taken = db.sql("SELECT seats_taken FROM live_sessions WHERE id = :id").param("id", sid).query(Integer.class).list();
            if (!taken.isEmpty() && seats < taken.get(0)) throw new ApiException(HttpStatus.BAD_REQUEST, "seats_below_taken");
            String startsAt = s.path("startsAt").asText("").trim();
            if (startsAt.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_startsAt");
            keep.add(sid);
            db.sql("""
                    INSERT INTO live_sessions(id, offering_id, starts_at, duration_min, seats, title)
                    VALUES (:id, :o, :at::timestamptz, :d, :seats, :t::jsonb)
                    ON CONFLICT (id) DO UPDATE SET starts_at = EXCLUDED.starts_at, duration_min = EXCLUDED.duration_min,
                      seats = EXCLUDED.seats, title = EXCLUDED.title WHERE live_sessions.offering_id = EXCLUDED.offering_id""")
                    .param("id", sid).param("o", offeringId).param("at", startsAt).param("d", s.path("durationMin").asInt(60))
                    .param("seats", seats).param("t", bilingual(s, "title", false)).update();
        }
        db.sql("DELETE FROM live_sessions WHERE offering_id = :o AND id <> ALL(string_to_array(:ids, ','))")
                .param("o", offeringId).param("ids", String.join(",", keep)).update();
    }

    /** Make sure every module and lesson has a stable id, so learner progress keeps pointing at the right lessons. */
    public String modules(JsonNode modules) {
        var out = MAPPER.createArrayNode();
        int mi = 0;
        for (JsonNode m : modules) {
            mi++;
            var mo = MAPPER.createObjectNode();
            mo.put("id", m.hasNonNull("id") && !m.get("id").asText().isBlank() ? m.get("id").asText() : "m" + mi + "-" + UUID.randomUUID().toString().substring(0, 4));
            mo.set("title", m.path("title"));
            var ls = mo.putArray("lessons");
            for (JsonNode l : m.path("lessons")) {
                var lo = MAPPER.createObjectNode();
                lo.put("id", l.hasNonNull("id") && !l.get("id").asText().isBlank() ? l.get("id").asText() : "l-" + UUID.randomUUID().toString().substring(0, 8));
                lo.set("title", l.path("title"));
                lo.put("minutes", l.path("minutes").asInt(0));
                String kind = l.path("kind").asText("video");
                lo.put("kind", Set.of("video", "live", "quiz", "resource").contains(kind) ? kind : "video");
                lo.put("preview", l.path("preview").asBoolean(false));
                ls.add(lo);
            }
            out.add(mo);
        }
        return out.toString();
    }

    /** {ar,en} as JSON text. A missing language falls back to the other; when `required` at least one must be present. */
    public String bilingual(JsonNode n, String field, boolean required) {
        String ar = n.path(field).path("ar").asText("").trim();
        String en = n.path(field).path("en").asText("").trim();
        if (required && ar.isEmpty() && en.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_" + field);
        var o = MAPPER.createObjectNode();
        o.put("ar", ar.isEmpty() ? en : ar);
        o.put("en", en.isEmpty() ? ar : en);
        return o.toString();
    }
}
