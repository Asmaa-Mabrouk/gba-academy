# Integrations to finish

Each integration is an interface in `services/api/src/main/java/sa/gba/academy/integrations/` with a working fake. To go live: write a class implementing the interface, annotate with `@ConditionalOnProperty(name="academy.integrations.<x>", havingValue="real")`, and set that property.

| Integration | Interface | Config key | Guide |
| --- | --- | --- | --- |
| Payments (mada, Apple Pay, card) | `PaymentGateway` | `payment` | [payment.md](payment.md) |
| ZATCA e-invoicing | `EInvoiceService` | `einvoice` | [zatca.md](zatca.md) |
| Recorded video hosting | `VideoHosting` | `video` | [video.md](video.md) |
| Live classroom | `LiveVideo` | `live` | [video.md](video.md) |
| Email / SMS | `MessagingService` | `messaging` | [video.md](video.md#messaging) |
