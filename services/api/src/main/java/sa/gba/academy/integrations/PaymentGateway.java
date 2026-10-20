package sa.gba.academy.integrations;

/**
 * PORT: card / mada / Apple Pay payments. A developer implements a real adapter (see docs/integrations/payment.md)
 * and switches `academy.integrations.payment` to `real`. Amounts are in halalas, VAT included.
 */
public interface PaymentGateway {
    record Charge(boolean success, String reference, String failureCode) {}

    Charge charge(String orderNumber, long totalHalalas, String method);

    /** Refund a previously successful charge. */
    boolean refund(String reference, long amountHalalas);
}
