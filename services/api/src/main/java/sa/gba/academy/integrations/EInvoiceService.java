package sa.gba.academy.integrations;

/**
 * PORT: ZATCA e-invoicing (Fatoora, phase 2). The real adapter must produce the UBL XML, QR code and clearance /
 * reporting call. See docs/integrations/zatca.md. Returns the invoice number to store on the order.
 */
public interface EInvoiceService {
    record InvoiceRequest(String orderNumber, String customerName, String customerEmail, long netHalalas,
                          long vatHalalas, long totalHalalas) {}

    String issue(InvoiceRequest request);
}
