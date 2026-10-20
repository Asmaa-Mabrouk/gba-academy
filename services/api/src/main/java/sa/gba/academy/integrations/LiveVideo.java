package sa.gba.academy.integrations;

import java.time.Instant;

/**
 * PORT: live classroom provider (Google Meet / Zoom / Teams / LiveKit...). See docs/integrations/video.md.
 * The API stores the returned URL on the session (`live_sessions.join_url`) and hands it only to the mentor, admins
 * and learners enrolled in that session's offering.
 */
public interface LiveVideo {
    /** What the provider created. `ref` identifies the meeting for later updates or cancellation (may be null). */
    record Room(String url, String provider, String ref) {}

    /** Create the meeting for a session. Throws if the provider cannot be reached; callers keep the session and retry later. */
    Room createMeeting(String sessionId, String title, Instant startsAt, int durationMin);

    /** The session moved or was renamed. Default: nothing to do. */
    default void updateMeeting(String ref, String title, Instant startsAt, int durationMin) {}

    /** The session was deleted. Default: nothing to do. */
    default void cancelMeeting(String ref) {}
}
