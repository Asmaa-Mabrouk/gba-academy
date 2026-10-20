package sa.gba.academy.integrations;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "academy.integrations.video", havingValue = "fake", matchIfMissing = true)
public class FakeVideoHosting implements VideoHosting {
    @Override
    public String playbackUrl(String lessonId, String userId) { return "about:blank#fake-video-" + lessonId; }
}
