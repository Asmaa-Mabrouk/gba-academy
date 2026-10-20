package sa.gba.academy.integrations;

import java.time.Instant;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Default adapter: no real meeting is created. Paste a real link on the session, or switch to `google-meet`. */
@Component
@ConditionalOnProperty(name = "academy.integrations.live", havingValue = "fake", matchIfMissing = true)
public class FakeLiveVideo implements LiveVideo {
    @Override
    public Room createMeeting(String sessionId, String title, Instant startsAt, int durationMin) {
        return new Room("about:blank#fake-room-" + sessionId, "fake", null);
    }
}
