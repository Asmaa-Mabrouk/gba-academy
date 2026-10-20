package sa.gba.academy.integrations;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "academy.integrations.messaging", havingValue = "fake", matchIfMissing = true)
public class LoggingMessagingService implements MessagingService {
    private static final Logger log = LoggerFactory.getLogger(LoggingMessagingService.class);

    @Override
    public void send(String to, String templateKey, Map<String, String> params) {
        log.info("[fake-messaging] to={} template={} params={}", to, templateKey, params);
    }
}
