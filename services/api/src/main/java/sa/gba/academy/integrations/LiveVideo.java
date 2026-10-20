package sa.gba.academy.integrations;

/** PORT: live classroom provider (Zoom / Teams / LiveKit...). See docs/integrations/video.md. */
public interface LiveVideo {
    /** Create the room for a session and return its join URL. */
    String createRoom(String sessionId, String title, java.time.Instant startsAt, int durationMin);

    /** Per-learner join link. */
    String joinLink(String sessionId, String userId);
}
