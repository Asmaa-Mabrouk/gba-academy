package sa.gba.academy.integrations;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "academy.integrations.einvoice", havingValue = "fake", matchIfMissing = true)
public class FakeEInvoiceService implements EInvoiceService {
    @Override
    public String issue(InvoiceRequest r) { return "INV-" + r.orderNumber().replace("GBA-", ""); }
}
