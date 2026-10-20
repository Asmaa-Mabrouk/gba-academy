package sa.gba.academy.integrations;

import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Always succeeds. For development and demos only. */
@Component
@ConditionalOnProperty(name = "academy.integrations.payment", havingValue = "fake", matchIfMissing = true)
public class FakePaymentGateway implements PaymentGateway {
    @Override
    public Charge charge(String orderNumber, long totalHalalas, String method) {
        return new Charge(true, "fake-" + UUID.randomUUID(), null);
    }

    @Override
    public boolean refund(String reference, long amountHalalas) { return true; }
}
