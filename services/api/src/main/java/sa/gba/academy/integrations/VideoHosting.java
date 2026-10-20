package sa.gba.academy.integrations;

/** PORT: hosting of recorded lessons. Returns a short-lived signed playback URL. See docs/integrations/video.md. */
public interface VideoHosting {
    String playbackUrl(String lessonId, String userId);
}
