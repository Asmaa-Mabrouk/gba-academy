package sa.gba.academy.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import sa.gba.academy.integrations.LiveVideo;

/**
 * Shared writing rules for course content, used by the admin and mentor portals:
 * the course row, its offerings and live sessions, the syllabus, quizzes and materials.
 * Every sanitising rule lives here so both portals behave the same.
 */
@Service
public class CourseWriter {
    private static final Logger log = LoggerFactory.getLogger(CourseWriter.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Set<String> AUDIENCES = Set.of("kids", "youth", "experts");
    private static final Set<String> LEVELS = Set.of("beginner", "intermediate", "advanced");
    private static final Set<String> MODES = Set.of("recorded", "live", "blended");
    private static final String FILE_PREFIX = "/api/v1/files/";
    private static final int MAX_QUESTIONS = 50;
    private static final int MAX_OPTIONS = 6;
    private static final int MAX_MATERIALS = 30;

    private final JdbcClient db;
    private final LiveVideo live;

    public CourseWriter(JdbcClient db, LiveVideo live) {
        this.db = db;
        this.live = live;
    }

    /**
     * @param mentorId   forces the course owner (mentor portal); null = take `mentorId` from the body (admin)
     * @param staffFlags true = admin: the body may set featured / new / bestseller / published / CPD points / mentor
     * @param newStatus  status of a NEW course: "approved" (admin) or "draft" (mentor); null = approved
     * @param createdBy  the account that created the course
     */
    public record Opts(String mentorId, boolean staffFlags, String newStatus, UUID createdBy) {}

    /** The three JSON documents derived from a request body. `quizzes` is null when the body did not carry quizzes (keep what is stored). */
    public record Content(String modules, String quizzes, String materials) {}

    // ------------------------------------------------------------------------------------------------ course

    /** Insert or update the course row, its offerings and sessions. The caller must run inside a transaction. */
    public void saveCourse(String id, JsonNode b, Opts o) {
        String slug = text(b, "slug");
        if (!slug.matches("[a-z0-9]+(-[a-z0-9]+)*")) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_slug");
        String audience = oneOf(b, "audience", AUDIENCES);
        String level = oneOf(b, "level", LEVELS);
        String mentorId = o.mentorId() != null ? o.mentorId() : text(b, "mentorId");
        if (db.sql("SELECT count(*) FROM mentors WHERE id = :m").param("m", mentorId).query(Integer.class).single() == 0)
            throw new ApiException(HttpStatus.BAD_REQUEST, "unknown_mentor");

        List<Map<String, Object>> cur = db.sql("SELECT slug, status FROM courses WHERE id = :id").param("id", id).query().listOfRows();
        boolean exists = !cur.isEmpty();
        if (exists && !slug.equals(cur.get(0).get("slug"))) throw new ApiException(HttpStatus.BAD_REQUEST, "slug_locked");
        String status = exists ? (String) cur.get(0).get("status") : (o.newStatus() == null ? "approved" : o.newStatus());
        boolean publish = o.staffFlags() && b.path("published").asBoolean(true);
        if (publish && !"approved".equals(status)) throw new ApiException(HttpStatus.CONFLICT, "not_approved");

        List<String> langs = new ArrayList<>();
        for (JsonNode l : b.path("languages")) if ("ar".equals(l.asText()) || "en".equals(l.asText())) langs.add(l.asText());
        if (langs.isEmpty()) langs.add("ar");
        Content content = content(b);

        db.sql("""
                INSERT INTO courses(id, slug, audience, level, topic, title, subtitle, description, outcomes, modules, mentor_id,
                  hours, languages, featured, is_new, bestseller, age_range, certificate, cpd_points, published,
                  status, created_by, materials, quizzes)
                VALUES (:id, :slug, :aud, :lvl, :topic, :title::jsonb, :sub::jsonb, :descr::jsonb, :outc::jsonb, :modl::jsonb, :mentor,
                  :hours, string_to_array(:langs, ','), :feat, :isnew, :best, :age, :cert, :cpd, :pub,
                  :status, :createdBy, :mats::jsonb, coalesce(:quiz::jsonb, '{}'::jsonb))
                ON CONFLICT (id) DO UPDATE SET audience = EXCLUDED.audience, level = EXCLUDED.level,
                  topic = EXCLUDED.topic, title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
                  outcomes = EXCLUDED.outcomes, modules = EXCLUDED.modules, hours = EXCLUDED.hours,
                  languages = EXCLUDED.languages, age_range = EXCLUDED.age_range, certificate = EXCLUDED.certificate,
                  materials = EXCLUDED.materials, quizzes = coalesce(:quiz::jsonb, courses.quizzes),
                  mentor_id    = CASE WHEN :flags THEN EXCLUDED.mentor_id ELSE courses.mentor_id END,
                  featured     = CASE WHEN :flags THEN EXCLUDED.featured ELSE courses.featured END,
                  is_new       = CASE WHEN :flags THEN EXCLUDED.is_new ELSE courses.is_new END,
                  bestseller   = CASE WHEN :flags THEN EXCLUDED.bestseller ELSE courses.bestseller END,
                  cpd_points   = CASE WHEN :flags THEN EXCLUDED.cpd_points ELSE courses.cpd_points END,
                  published    = CASE WHEN :flags THEN EXCLUDED.published ELSE courses.published END""")
                .param("id", id).param("slug", slug).param("aud", audience).param("lvl", level)
                .param("topic", text(b, "topic")).param("title", bilingual(b, "title", true))
                .param("sub", bilingual(b, "subtitle", false)).param("descr", bilingual(b, "description", false))
                .param("outc", array(b, "outcomes")).param("modl", content.modules()).param("mentor", mentorId)
                .param("hours", Math.max(0, b.path("hours").asInt(0))).param("langs", String.join(",", langs))
                .param("feat", o.staffFlags() && b.path("featured").asBoolean(false))
                .param("isnew", o.staffFlags() && b.path("isNew").asBoolean(false))
                .param("best", o.staffFlags() && b.path("bestseller").asBoolean(false))
                .param("age", b.hasNonNull("ageRange") && !b.get("ageRange").asText().isBlank() ? b.get("ageRange").asText() : null)
                .param("cert", b.path("certificate").asBoolean(true))
                .param("cpd", o.staffFlags() && b.hasNonNull("cpdPoints") ? b.get("cpdPoints").asInt() : null)
                .param("pub", publish).param("flags", o.staffFlags()).param("status", status).param("createdBy", o.createdBy())
                .param("mats", content.materials()).param("quiz", content.quizzes()).update();

        saveOfferings(id, slug, b.path("offerings"));
    }

    private void saveOfferings(String courseId, String slug, JsonNode offerings) {
        List<String> keep = new ArrayList<>();
        for (JsonNode o : offerings) {
            String mode = oneOf(o, "mode", MODES);
            String oid = o.hasNonNull("id") && !o.get("id").asText().isBlank() ? o.get("id").asText() : slug + "-" + mode;
            long price = o.path("priceHalalas").asLong(-1);
            if (price < 0) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_price");
            Integer capacity = null;
            Integer minLearners = null;
            if (!"recorded".equals(mode)) {
                capacity = o.hasNonNull("capacity") ? o.get("capacity").asInt(0) : null;
                minLearners = o.hasNonNull("minLearners") ? o.get("minLearners").asInt(0) : null;
                if ((capacity != null && capacity <= 0) || (minLearners != null && minLearners <= 0)
                        || (capacity != null && minLearners != null && minLearners > capacity))
                    throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_capacity");
                if (capacity != null) {
                    int enrolled = db.sql("SELECT count(*) FROM enrollments WHERE offering_id = :o").param("o", oid).query(Integer.class).single();
                    if (capacity < enrolled) throw new ApiException(HttpStatus.BAD_REQUEST, "capacity_below_enrolled");
                }
            }
            keep.add(oid);
            db.sql("""
                    INSERT INTO offerings(id, course_id, mode, price_halalas, compare_at_halalas, access_days, cohort_label, capacity, min_learners)
                    VALUES (:id, :c, :m, :p, :cmp, :acc, :coh::jsonb, :cap, :min)
                    ON CONFLICT (id) DO UPDATE SET mode = EXCLUDED.mode, price_halalas = EXCLUDED.price_halalas,
                      compare_at_halalas = EXCLUDED.compare_at_halalas, access_days = EXCLUDED.access_days, cohort_label = EXCLUDED.cohort_label,
                      capacity = EXCLUDED.capacity, min_learners = EXCLUDED.min_learners
                    WHERE offerings.course_id = EXCLUDED.course_id""")
                    .param("id", oid).param("c", courseId).param("m", mode).param("p", price)
                    .param("cmp", o.hasNonNull("compareAtHalalas") ? o.get("compareAtHalalas").asLong() : null)
                    .param("acc", o.hasNonNull("accessDays") ? o.get("accessDays").asInt() : null)
                    .param("coh", o.hasNonNull("cohortLabel") ? o.get("cohortLabel").toString() : null)
                    .param("cap", capacity).param("min", minLearners).update();
            saveSessions(oid, o.path("sessions"), capacity);
        }
        // Remove offerings that were dropped, unless somebody already bought them.
        List<String> existing = db.sql("SELECT id FROM offerings WHERE course_id = :c").param("c", courseId).query(String.class).list();
        for (String oid : existing) {
            if (keep.contains(oid)) continue;
            boolean used = db.sql("SELECT (SELECT count(*) FROM order_lines WHERE offering_id = :o) + (SELECT count(*) FROM enrollments WHERE offering_id = :o)")
                    .param("o", oid).query(Integer.class).single() > 0;
            if (used) throw new ApiException(HttpStatus.CONFLICT, "offering_in_use");
            for (String ref : db.sql("SELECT meeting_ref FROM live_sessions WHERE offering_id = :o AND meeting_provider = 'google_meet' AND meeting_ref IS NOT NULL")
                    .param("o", oid).query(String.class).list()) cancelMeeting("google_meet", ref);
            db.sql("DELETE FROM live_sessions WHERE offering_id = :o").param("o", oid).update();
            db.sql("DELETE FROM offerings WHERE id = :o").param("o", oid).update();
        }
    }

    // ------------------------------------------------------------------------------------------------ live sessions

    /** Mentor portal: sessions of an existing offering, keeping that offering's capacity. */
    public void saveSessions(String offeringId, JsonNode sessions) {
        List<Integer> cap = db.sql("SELECT capacity FROM offerings WHERE id = :o").param("o", offeringId).query(Integer.class).list();
        saveSessions(offeringId, sessions, cap.isEmpty() ? null : cap.get(0));
    }

    /**
     * Upsert the live sessions of one offering; sessions missing from the list are deleted. Seats taken are preserved.
     * When the offering has a `capacity`, every session gets that many seats.
     * The meeting link: a pasted https link is kept as "manual"; an empty one is generated by the LiveVideo adapter
     * (Google Meet when enabled). A provider failure never blocks saving: the session just has no link yet.
     */
    public void saveSessions(String offeringId, JsonNode sessions, Integer capacity) {
        List<String> keep = new ArrayList<>();
        List<String> needLink = new ArrayList<>();
        for (JsonNode s : sessions) {
            String sid = s.hasNonNull("id") && !s.get("id").asText().isBlank() ? s.get("id").asText() : "s-" + UUID.randomUUID();
            int seats = capacity != null ? capacity : s.path("seats").asInt(0);
            if (seats <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_seats");
            String startsAt = s.path("startsAt").asText("").trim();
            if (startsAt.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_startsAt");
            try { OffsetDateTime.parse(startsAt); } catch (DateTimeParseException e) { throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_startsAt"); }
            int duration = Math.max(5, s.path("durationMin").asInt(60));
            String title = bilingual(s, "title", false);

            List<Map<String, Object>> old = db.sql("""
                    SELECT s.seats_taken, s.join_url, s.meeting_provider, s.meeting_ref,
                           (s.starts_at <> :at::timestamptz OR s.duration_min <> :d) AS moved
                    FROM live_sessions s WHERE s.id = :id AND s.offering_id = :o""")
                    .param("id", sid).param("o", offeringId).param("at", startsAt).param("d", duration).query().listOfRows();
            boolean isNew = old.isEmpty();
            if (!isNew && seats < ((Number) old.get(0).get("seats_taken")).intValue()) throw new ApiException(HttpStatus.BAD_REQUEST, "seats_below_taken");

            String curUrl = isNew ? null : (String) old.get(0).get("join_url");
            String curProvider = isNew ? null : (String) old.get(0).get("meeting_provider");
            String curRef = isNew ? null : (String) old.get(0).get("meeting_ref");
            String url = curUrl;
            String provider = curProvider;
            String ref = curRef;
            if (s.has("joinUrl")) {
                String wanted = s.hasNonNull("joinUrl") ? s.get("joinUrl").asText("").trim() : "";
                if (!wanted.isEmpty() && !wanted.matches("https://\\S+")) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_join_url");
                if (wanted.isEmpty()) {
                    cancelMeeting(curProvider, curRef);
                    url = null; provider = null; ref = null;
                } else if (!wanted.equals(curUrl)) {
                    cancelMeeting(curProvider, curRef);
                    url = wanted; provider = "manual"; ref = null;
                }
            }
            if (!isNew && Boolean.TRUE.equals(old.get(0).get("moved")) && "google_meet".equals(provider) && ref != null) {
                try {
                    live.updateMeeting(ref, "GBA: " + titleText(title), OffsetDateTime.parse(startsAt).toInstant(), duration);
                } catch (RuntimeException e) {
                    log.warn("Could not move the meeting of session {}: {}", sid, e.getMessage());
                }
            }
            keep.add(sid);
            if (url == null) needLink.add(sid);
            db.sql("""
                    INSERT INTO live_sessions(id, offering_id, starts_at, duration_min, seats, title, join_url, meeting_provider, meeting_ref)
                    VALUES (:id, :o, :at::timestamptz, :d, :seats, :t::jsonb, :url, :prov, :ref)
                    ON CONFLICT (id) DO UPDATE SET starts_at = EXCLUDED.starts_at, duration_min = EXCLUDED.duration_min,
                      seats = EXCLUDED.seats, title = EXCLUDED.title, join_url = EXCLUDED.join_url,
                      meeting_provider = EXCLUDED.meeting_provider, meeting_ref = EXCLUDED.meeting_ref
                    WHERE live_sessions.offering_id = EXCLUDED.offering_id""")
                    .param("id", sid).param("o", offeringId).param("at", startsAt).param("d", duration)
                    .param("seats", seats).param("t", title).param("url", url).param("prov", provider).param("ref", ref).update();
        }
        for (String ref : db.sql("SELECT meeting_ref FROM live_sessions WHERE offering_id = :o AND meeting_provider = 'google_meet' AND meeting_ref IS NOT NULL AND id <> ALL(string_to_array(:ids, ','))")
                .param("o", offeringId).param("ids", String.join(",", keep)).query(String.class).list()) cancelMeeting("google_meet", ref);
        db.sql("DELETE FROM live_sessions WHERE offering_id = :o AND id <> ALL(string_to_array(:ids, ','))")
                .param("o", offeringId).param("ids", String.join(",", keep)).update();
        for (String sid : needLink) ensureMeeting(sid);
    }

    /**
     * Make sure a session has a meeting link, creating one with the LiveVideo adapter when it has none.
     * @return the link, or null when the provider could not create it (the caller can retry later)
     */
    public String ensureMeeting(String sessionId) {
        List<Map<String, Object>> r = db.sql("""
                SELECT join_url, coalesce(title ->> 'en', title ->> 'ar', '') AS t, extract(epoch from starts_at) AS at, duration_min
                FROM live_sessions WHERE id = :id""").param("id", sessionId).query().listOfRows();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        String have = (String) r.get(0).get("join_url");
        if (have != null && !have.isBlank()) return have;
        try {
            LiveVideo.Room room = live.createMeeting(sessionId, "GBA: " + titleText((String) r.get(0).get("t")),
                    Instant.ofEpochSecond(((Number) r.get(0).get("at")).longValue()), ((Number) r.get(0).get("duration_min")).intValue());
            db.sql("UPDATE live_sessions SET join_url = :u, meeting_provider = :p, meeting_ref = :r WHERE id = :id")
                    .param("u", room.url()).param("p", room.provider()).param("r", room.ref()).param("id", sessionId).update();
            return room.url();
        } catch (RuntimeException e) {
            log.warn("Could not create a meeting for session {}: {}", sessionId, e.getMessage());
            return null;
        }
    }

    private void cancelMeeting(String provider, String ref) {
        if (!"google_meet".equals(provider) || ref == null) return;
        try {
            live.cancelMeeting(ref);
        } catch (RuntimeException e) {
            log.warn("Could not cancel meeting {}: {}", ref, e.getMessage());
        }
    }

    private static String titleText(String json) {
        try {
            JsonNode n = MAPPER.readTree(json);
            if (n.isObject()) return n.path("en").asText(n.path("ar").asText("live session"));
        } catch (Exception ignored) { /* not JSON: plain text */ }
        return json == null || json.isBlank() ? "live session" : json;
    }

    // ------------------------------------------------------------------------------------------------ content

    /** Syllabus, quizzes and materials of a request body, sanitised. */
    public Content content(JsonNode b) {
        ArrayNode modules = modulesNode(b.path("modules"));
        Set<String> quizLessons = new HashSet<>();
        for (JsonNode m : modules) for (JsonNode l : m.path("lessons")) if ("quiz".equals(l.path("kind").asText())) quizLessons.add(l.path("id").asText());
        String quizzes = b.has("quizzes") && b.get("quizzes").isObject() ? quizzesNode(b.get("quizzes"), quizLessons).toString() : null;
        return new Content(modules.toString(), quizzes, materialsNode(b.path("materials")).toString());
    }

    /** Make sure every module and lesson has a stable id, so learner progress keeps pointing at the right lessons. */
    public String modules(JsonNode modules) { return modulesNode(modules).toString(); }

    private ArrayNode modulesNode(JsonNode modules) {
        ArrayNode out = MAPPER.createArrayNode();
        int mi = 0;
        for (JsonNode m : modules) {
            mi++;
            ObjectNode mo = MAPPER.createObjectNode();
            mo.put("id", m.hasNonNull("id") && !m.get("id").asText().isBlank() ? m.get("id").asText() : "m" + mi + "-" + UUID.randomUUID().toString().substring(0, 4));
            mo.set("title", m.path("title"));
            ArrayNode ls = mo.putArray("lessons");
            for (JsonNode l : m.path("lessons")) {
                ObjectNode lo = MAPPER.createObjectNode();
                lo.put("id", l.hasNonNull("id") && !l.get("id").asText().isBlank() ? l.get("id").asText() : "l-" + UUID.randomUUID().toString().substring(0, 8));
                lo.set("title", l.path("title"));
                lo.put("minutes", l.path("minutes").asInt(0));
                String kind = l.path("kind").asText("video");
                lo.put("kind", Set.of("video", "live", "quiz", "resource").contains(kind) ? kind : "video");
                lo.put("preview", l.path("preview").asBoolean(false));
                if (l.path("description").isObject()) lo.set("description", tree(bilingual(l, "description", false)));
                ObjectNode video = videoNode(l.path("video"));
                if (video != null) lo.set("video", video);
                ArrayNode mats = materialsNode(l.path("materials"));
                if (!mats.isEmpty()) lo.set("materials", mats);
                ls.add(lo);
            }
            out.add(mo);
        }
        return out;
    }

    /** A lesson video is either an uploaded file ({fileId}) or an external https link ({url}). */
    private static ObjectNode videoNode(JsonNode v) {
        if (!v.isObject()) return null;
        ObjectNode o = MAPPER.createObjectNode();
        String fileId = v.path("fileId").asText("");
        if (isUuid(fileId)) o.put("fileId", fileId);
        String url = v.path("url").asText("").trim();
        if (url.matches("https://\\S+")) o.put("url", url);
        String name = v.path("name").asText("").trim();
        if (!name.isEmpty() && o.size() > 0) o.put("name", name.length() > 200 ? name.substring(0, 200) : name);
        return o.size() == 0 ? null : o;
    }

    /** Downloads: [{id, name, url, size}]. The url is an uploaded file of this API or an https link. */
    private static ArrayNode materialsNode(JsonNode list) {
        ArrayNode out = MAPPER.createArrayNode();
        if (!list.isArray()) return out;
        for (JsonNode m : list) {
            if (out.size() >= MAX_MATERIALS) break;
            String name = m.path("name").asText("").trim();
            String url = m.path("url").asText("").trim();
            if (name.isEmpty() || !(url.startsWith(FILE_PREFIX) || url.matches("https://\\S+"))) continue;
            ObjectNode o = MAPPER.createObjectNode();
            o.put("id", m.hasNonNull("id") && !m.get("id").asText().isBlank() ? m.get("id").asText() : "f-" + UUID.randomUUID().toString().substring(0, 8));
            o.put("name", name.length() > 200 ? name.substring(0, 200) : name);
            o.put("url", url);
            o.put("size", Math.max(0, m.path("size").asLong(0)));
            out.add(o);
        }
        return out;
    }

    /**
     * {lessonId: {passPct, questions:[{id, prompt, options:[{id,text}], correctId, explanation?}]}}.
     * Only quiz lessons keep a quiz. Saving is lenient (a draft may be unfinished); {@link #requireComplete} checks it on submit.
     */
    private ObjectNode quizzesNode(JsonNode quizzes, Set<String> quizLessons) {
        ObjectNode out = MAPPER.createObjectNode();
        var names = quizzes.fieldNames();
        while (names.hasNext()) {
            String lessonId = names.next();
            if (!quizLessons.contains(lessonId)) continue;
            JsonNode q = quizzes.get(lessonId);
            ObjectNode qo = MAPPER.createObjectNode();
            qo.put("passPct", Math.min(100, Math.max(1, q.path("passPct").asInt(70))));
            ArrayNode qs = qo.putArray("questions");
            for (JsonNode x : q.path("questions")) {
                if (qs.size() >= MAX_QUESTIONS) break;
                String ar = x.path("prompt").path("ar").asText("").trim();
                String en = x.path("prompt").path("en").asText("").trim();
                if (ar.isEmpty() && en.isEmpty()) continue;
                ObjectNode xo = MAPPER.createObjectNode();
                xo.put("id", x.hasNonNull("id") && !x.get("id").asText().isBlank() ? x.get("id").asText() : "q-" + UUID.randomUUID().toString().substring(0, 8));
                xo.set("prompt", tree(bilingual(x, "prompt", false)));
                ArrayNode os = xo.putArray("options");
                Set<String> ids = new HashSet<>();
                int oi = 0;
                for (JsonNode op : x.path("options")) {
                    if (os.size() >= MAX_OPTIONS) break;
                    oi++;
                    if (op.path("text").path("ar").asText("").isBlank() && op.path("text").path("en").asText("").isBlank()) continue;
                    ObjectNode oo = MAPPER.createObjectNode();
                    String oid = op.hasNonNull("id") && !op.get("id").asText().isBlank() ? op.get("id").asText() : "o" + oi;
                    oo.put("id", oid);
                    oo.set("text", tree(bilingual(op, "text", false)));
                    os.add(oo);
                    ids.add(oid);
                }
                String correct = x.path("correctId").asText("");
                xo.put("correctId", ids.contains(correct) ? correct : "");
                if (!x.path("explanation").path("ar").asText("").isBlank() || !x.path("explanation").path("en").asText("").isBlank())
                    xo.set("explanation", tree(bilingual(x, "explanation", false)));
                qs.add(xo);
            }
            out.set(lessonId, qo);
        }
        return out;
    }

    /**
     * Is the course ready for review? Used when a mentor submits it and when an admin approves it.
     * Throws 400 `incomplete_course` (no title, no lesson or no offering) or `quiz_incomplete`.
     */
    public void requireComplete(String courseId) {
        List<Map<String, Object>> r = db.sql("SELECT title::text AS title, modules::text AS modules, quizzes::text AS quizzes FROM courses WHERE id = :id")
                .param("id", courseId).query().listOfRows();
        if (r.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        try {
            JsonNode title = MAPPER.readTree((String) r.get(0).get("title"));
            JsonNode modules = MAPPER.readTree((String) r.get(0).get("modules"));
            JsonNode quizzes = MAPPER.readTree((String) r.get(0).get("quizzes"));
            int lessons = 0;
            boolean titled = !title.path("ar").asText("").isBlank() || !title.path("en").asText("").isBlank();
            for (JsonNode m : modules) {
                for (JsonNode l : m.path("lessons")) {
                    lessons++;
                    if ("quiz".equals(l.path("kind").asText()) && !quizOk(quizzes.path(l.path("id").asText()))) throw new ApiException(HttpStatus.BAD_REQUEST, "quiz_incomplete");
                }
            }
            int offerings = db.sql("SELECT count(*) FROM offerings WHERE course_id = :c").param("c", courseId).query(Integer.class).single();
            if (!titled || lessons == 0 || offerings == 0) throw new ApiException(HttpStatus.BAD_REQUEST, "incomplete_course");
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "incomplete_course");
        }
    }

    private static boolean quizOk(JsonNode quiz) {
        if (!quiz.path("questions").isArray() || quiz.path("questions").isEmpty()) return false;
        for (JsonNode q : quiz.path("questions")) {
            if (q.path("options").size() < 2 || q.path("correctId").asText("").isBlank()) return false;
            boolean found = false;
            for (JsonNode o : q.path("options")) if (o.path("id").asText().equals(q.path("correctId").asText())) found = true;
            if (!found) return false;
        }
        return true;
    }

    // ------------------------------------------------------------------------------------------------ helpers

    /** {ar,en} as JSON text. A missing language falls back to the other; when `required` at least one must be present. */
    public String bilingual(JsonNode n, String field, boolean required) {
        String ar = n.path(field).path("ar").asText("").trim();
        String en = n.path(field).path("en").asText("").trim();
        if (required && ar.isEmpty() && en.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_" + field);
        ObjectNode o = MAPPER.createObjectNode();
        o.put("ar", ar.isEmpty() ? en : ar);
        o.put("en", en.isEmpty() ? ar : en);
        return o.toString();
    }

    public static String text(JsonNode n, String f) {
        String v = n.path(f).asText("").trim();
        if (v.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "missing_" + f);
        return v;
    }

    private static String oneOf(JsonNode n, String f, Set<String> allowed) {
        String v = n.path(f).asText("");
        if (!allowed.contains(v)) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_" + f);
        return v;
    }

    private static String array(JsonNode n, String f) { return n.path(f).isArray() ? n.get(f).toString() : "[]"; }

    private static JsonNode tree(String json) {
        try {
            return MAPPER.readTree(json);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("invalid JSON built by the API", e);
        }
    }

    private static boolean isUuid(String s) {
        try { UUID.fromString(s); return true; } catch (IllegalArgumentException e) { return false; }
    }
}
