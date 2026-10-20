# Payments

**Port**: `PaymentGateway.charge(orderNumber, totalHalalas, method)` returns success, a gateway reference or a failure code. `refund(reference, amount)` for refunds.

**To do**
1. Pick a Saudi gateway that supports mada, Apple Pay and cards (for example HyperPay, Moyasar, Tap, PayTabs). Needs a merchant account.
2. Prefer a hosted payment page or tokenised card fields so card data never touches our servers (PCI scope).
3. Today `OrderController.create` charges synchronously. Most gateways need a redirect or 3-D Secure step: change to create a `pending` order, return a redirect URL, then confirm through a webhook that marks the order `paid` and creates enrollments (move the enrollment block into a service method called by the webhook).
4. Verify webhook signatures; make webhook handling idempotent on `gateway_ref`.
5. Web: `CheckoutView.tsx` has a demo card form; replace with the gateway's widget.
6. Refund policy and its text must be shown before payment (`course.refundNote`).
