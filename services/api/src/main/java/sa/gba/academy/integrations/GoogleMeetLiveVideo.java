package sa.gba.academy.integrations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Real adapter: creates a Google Calendar event with a Google Meet conference, and returns the Meet link.
 * Enabled with `academy.integrations.live: google-meet` plus the Google credentials in application.yml.
 * Setup steps and Meet host-control advice: docs/integrations/video.md.
 *
 * It uses a long-lived OAuth refresh token of the academy's own Google account (the organiser of every session),
 * so no extra library is needed: only java.net.http and Jackson.
 */
@Component
@ConditionalOnProperty(name = "academy.integrations.live", havingValue = "google-meet")
public class GoogleMeetLiveVideo implements LiveVideo {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String EVENTS = "https://www.googleapis.com/calendar/v3/calendars/";

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final String clientId;
    private final String clientSecret;
    private final String refreshToken;
    private final String calendarId;
    private String accessToken;
    private Instant accessUntil = Instant.EPOCH;

    public GoogleMeetLiveVideo(@Value("${academy.google.client-id:}") String clientId,
                               @Value("${academy.google.client-secret:}") String clientSecret,
                               @Value("${academy.google.refresh-token:}") String refreshToken,
                               @Value("${academy.google.calendar-id:primary}") String calendarId) {
        if (clientId.isBlank() || clientSecret.isBlank() || refreshToken.isBlank())
            throw new IllegalStateException("academy.integrations.live=google-meet needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN");
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.calendarId = calendarId;
    }

    @Override
    public Room createMeeting(String sessionId, String title, Instant startsAt, int durationMin) {
        ObjectNode ev = eventBody(title, startsAt, durationMin);
        ObjectNode create = ev.putObject("conferenceData").putObject("createRequest");
        create.put("requestId", sessionId + "-" + UUID.randomUUID());
        create.putObject("conferenceSolutionKey").put("type", "hangoutsMeet");
        JsonNode created = call("POST", EVENTS + enc(calendarId) + "/events?conferenceDataVersion=1&sendUpdates=none", ev);
        String id = created.path("id").asText("");
        String link = linkOf(created);
        // Google creates the conference asynchronously: re-read the event a few times if the link is not there yet.
        for (int i = 0; i < 3 && link.isEmpty() && !id.isEmpty(); i++) {
            sleep(1000);
            link = linkOf(call("GET", EVENTS + enc(calendarId) + "/events/" + enc(id) + "?conferenceDataVersion=1", null));
        }
        if (link.isEmpty()) throw new IllegalStateException("Google did not return a Meet link");
        return new Room(link, "google_meet", id);
    }

    @Override
    public void updateMeeting(String ref, String title, Instant startsAt, int durationMin) {
        if (ref == null || ref.isBlank()) return;
        call("PATCH", EVENTS + enc(calendarId) + "/events/" + enc(ref) + "?sendUpdates=none", eventBody(title, startsAt, durationMin));
    }

    @Override
    public void cancelMeeting(String ref) {
        if (ref == null || ref.isBlank()) return;
        call("DELETE", EVENTS + enc(calendarId) + "/events/" + enc(ref) + "?sendUpdates=none", null);
    }

    private static ObjectNode eventBody(String title, Instant startsAt, int durationMin) {
        ObjectNode ev = JSON.createObjectNode();
        ev.put("summary", title);
        ev.putObject("start").put("dateTime", startsAt.toString());
        ev.putObject("end").put("dateTime", startsAt.plusSeconds(durationMin * 60L).toString());
        return ev;
    }

    private static String linkOf(JsonNode event) {
        String link = event.path("hangoutLink").asText("");
        if (!link.isEmpty()) return link;
        for (JsonNode p : event.path("conferenceData").path("entryPoints"))
            if ("video".equals(p.path("entryPointType").asText())) return p.path("uri").asText("");
        return "";
    }

    private JsonNode call(String method, String url, JsonNode body) {
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + token()).header("Content-Type", "application/json");
            HttpRequest.BodyPublisher pub = body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body.toString());
            HttpResponse<String> r = http.send(b.method(method, pub).build(), HttpResponse.BodyHandlers.ofString());
            if (r.statusCode() / 100 != 2) throw new IllegalStateException("Google Calendar answered HTTP " + r.statusCode());
            return r.body() == null || r.body().isBlank() ? JSON.createObjectNode() : JSON.readTree(r.body());
        } catch (IOException e) {
            throw new IllegalStateException("Google Calendar is not reachable", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while calling Google Calendar", e);
        }
    }

    private synchronized String token() throws IOException, InterruptedException {
        if (accessToken != null && Instant.now().isBefore(accessUntil.minusSeconds(60))) return accessToken;
        String form = "grant_type=refresh_token&client_id=" + enc(clientId) + "&client_secret=" + enc(clientSecret) + "&refresh_token=" + enc(refreshToken);
        HttpRequest req = HttpRequest.newBuilder(URI.create(TOKEN_URL)).timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(form)).build();
        HttpResponse<String> r = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (r.statusCode() / 100 != 2) throw new IllegalStateException("Google sign-in failed with HTTP " + r.statusCode() + " (check the refresh token)");
        JsonNode j = JSON.readTree(r.body());
        accessToken = j.path("access_token").asText();
        accessUntil = Instant.now().plusSeconds(j.path("expires_in").asLong(3000));
        return accessToken;
    }

    private static String enc(String s) { return URLEncoder.encode(s, StandardCharsets.UTF_8); }

    private static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
