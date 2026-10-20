package sa.gba.academy.integrations;

import java.time.Instant;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "academy.integrations.live", havingValue = "fake", matchIfMissing = true)
public class FakeLiveVideo implements LiveVideo {
    @Override
    public String createRoom(String sessionId, String title, Instant startsAt, int durationMin) { return "about:blank#fake-room-" + sessionId; }

    @Override
    public String joinLink(String sessionId, String userId) { return "about:blank#fake-join-" + sessionId; }
}
