package sa.gba.academy.files;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import sa.gba.academy.auth.AuthInterceptor;
import sa.gba.academy.auth.JwtService;
import sa.gba.academy.auth.Roles;
import sa.gba.academy.common.ApiException;
import sa.gba.academy.integrations.FileStorage;

/**
 * Uploads (admins and mentors) and downloads.
 * The file type is decided by looking at the first bytes, never by the name or the type the browser claims, so an HTML or
 * script file cannot be uploaded as a picture. Images are public. Videos and documents are served only to admins, the uploader,
 * the mentor of a course that uses the file, and learners enrolled in such a course. A browser cannot send an Authorization
 * header from a video or download link, so these links may carry the token in `?t=`.
 */
@RestController
@RequestMapping("/api/v1")
public class FileController {
    private static final long MB = 1024L * 1024L;
    private static final Map<String, Long> MAX_BYTES = Map.of("image", 5 * MB, "document", 25 * MB, "video", 500 * MB);

    /** What a sniffed file is: its kind, stored content type and extension. */
    private record Detected(String kind, String contentType, String ext) {}

    private final JdbcClient db;
    private final Roles roles;
    private final FileStorage storage;
    private final JwtService jwt;

    public FileController(JdbcClient db, Roles roles, FileStorage storage, JwtService jwt) {
        this.db = db;
        this.roles = roles;
        this.storage = storage;
        this.jwt = jwt;
    }

    @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file, @RequestParam("kind") String kind,
                                                      HttpServletRequest req) throws IOException {
        UUID user = roles.requireAny(req, "admin", "mentor");
        Long max = MAX_BYTES.get(kind);
        if (max == null) throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_kind");
        if (file.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "empty_file");
        if (file.getSize() > max) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "file_too_large");

        String name = cleanName(file.getOriginalFilename());
        byte[] head;
        try (InputStream in = file.getInputStream()) { head = in.readNBytes(16); }
        Detected d = sniff(head, name);
        if (d == null || !d.kind().equals(kind)) throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "unsupported_file_type");

        UUID id = UUID.randomUUID();
        String key = id.toString().substring(0, 2) + "/" + id + "." + d.ext();
        long size;
        try (InputStream in = file.getInputStream()) { size = storage.save(key, in); }
        db.sql("""
                INSERT INTO media_files(id, kind, original_name, content_type, size_bytes, storage_key, uploaded_by)
                VALUES (:id, :k, :n, :ct, :s, :key, :u)""")
                .param("id", id).param("k", d.kind()).param("n", name).param("ct", d.contentType()).param("s", size)
                .param("key", key).param("u", user).update();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", id.toString());
        out.put("url", "/api/v1/files/" + id);
        out.put("name", name);
        out.put("size", size);
        out.put("kind", d.kind());
        out.put("contentType", d.contentType());
        return ResponseEntity.status(HttpStatus.CREATED).body(out);
    }

    @GetMapping("/files/{id}")
    public ResponseEntity<Resource> download(@PathVariable UUID id, @RequestParam(value = "t", required = false) String token,
                                             HttpServletRequest req) {
        List<Map<String, Object>> rows = db.sql("SELECT kind, original_name, content_type, storage_key FROM media_files WHERE id = :id")
                .param("id", id).query().listOfRows();
        if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        Map<String, Object> f = rows.get(0);
        String kind = (String) f.get("kind");
        boolean isPublic = "image".equals(kind);
        if (!isPublic && !mayOpen(userOf(req, token), id)) throw new ApiException(HttpStatus.FORBIDDEN, "forbidden");

        Resource body = storage.open((String) f.get("storage_key"));
        if (!body.exists()) throw new ApiException(HttpStatus.NOT_FOUND, "not_found");
        ContentDisposition disposition = "document".equals(kind)
                ? ContentDisposition.attachment().filename((String) f.get("original_name"), StandardCharsets.UTF_8).build()
                : ContentDisposition.inline().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType((String) f.get("content_type")))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(isPublic ? CacheControl.maxAge(java.time.Duration.ofDays(1)).cachePublic() : CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePrivate())
                .body(body);
    }

    /** The signed-in user from the Authorization header or, for video and download links, from `?t=`. Null when anonymous. */
    private UUID userOf(HttpServletRequest req, String token) {
        try {
            return AuthInterceptor.require(req);
        } catch (ApiException e) {
            return token == null ? null : jwt.parse(token).orElse(null);
        }
    }

    private boolean mayOpen(UUID user, UUID fileId) {
        if (user == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "unauthorized");
        String like = "%" + fileId + "%";
        return db.sql("""
                SELECT (
                  EXISTS (SELECT 1 FROM users u WHERE u.id = :u AND 'admin' = ANY(u.roles))
                  OR EXISTS (SELECT 1 FROM media_files f WHERE f.id = :f AND f.uploaded_by = :u)
                  OR EXISTS (SELECT 1 FROM courses c JOIN mentors m ON m.id = c.mentor_id
                             WHERE m.user_id = :u AND (c.modules::text LIKE :like OR c.materials::text LIKE :like))
                  OR EXISTS (SELECT 1 FROM enrollments e JOIN offerings o ON o.id = e.offering_id JOIN courses c ON c.id = o.course_id
                             WHERE e.user_id = :u AND c.published AND (e.expires_at IS NULL OR e.expires_at > now())
                               AND (c.modules::text LIKE :like OR c.materials::text LIKE :like))
                )""").param("u", user).param("f", fileId).param("like", like).query(Boolean.class).single();
    }

    // ------------------------------------------------------------------------------------------------ type detection

    private static Detected sniff(byte[] h, String name) {
        String ext = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase() : "";
        if (starts(h, 0x89, 0x50, 0x4E, 0x47)) return new Detected("image", "image/png", "png");
        if (starts(h, 0xFF, 0xD8, 0xFF)) return new Detected("image", "image/jpeg", "jpg");
        if (h.length >= 12 && ascii(h, 0, "RIFF") && ascii(h, 8, "WEBP")) return new Detected("image", "image/webp", "webp");
        if (ascii(h, 0, "%PDF")) return new Detected("document", "application/pdf", "pdf");
        if (starts(h, 0x50, 0x4B, 0x03, 0x04)) { // OOXML files are ZIP containers: the extension picks which
            return switch (ext) {
                case "docx" -> new Detected("document", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx");
                case "pptx" -> new Detected("document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx");
                case "xlsx" -> new Detected("document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx");
                default -> null;
            };
        }
        if (starts(h, 0xD0, 0xCF, 0x11, 0xE0)) { // legacy Office
            return switch (ext) {
                case "doc" -> new Detected("document", "application/msword", "doc");
                case "ppt" -> new Detected("document", "application/vnd.ms-powerpoint", "ppt");
                case "xls" -> new Detected("document", "application/vnd.ms-excel", "xls");
                default -> null;
            };
        }
        if (h.length >= 8 && ascii(h, 4, "ftyp")) return new Detected("video", "video/mp4", "mp4");
        if (starts(h, 0x1A, 0x45, 0xDF, 0xA3)) return new Detected("video", "video/webm", "webm");
        return null;
    }

    private static boolean starts(byte[] h, int... sig) {
        if (h.length < sig.length) return false;
        for (int i = 0; i < sig.length; i++) if ((h[i] & 0xFF) != sig[i]) return false;
        return true;
    }

    private static boolean ascii(byte[] h, int at, String s) {
        if (h.length < at + s.length()) return false;
        for (int i = 0; i < s.length(); i++) if (h[at + i] != (byte) s.charAt(i)) return false;
        return true;
    }

    private static String cleanName(String original) {
        String n = original == null ? "file" : original;
        n = n.substring(Math.max(n.lastIndexOf('/'), n.lastIndexOf('\\')) + 1).replaceAll("[\\p{Cntrl}]", "").trim();
        if (n.isEmpty()) n = "file";
        return n.length() > 200 ? n.substring(n.length() - 200) : n;
    }
}
