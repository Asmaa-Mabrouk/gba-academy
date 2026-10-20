# ZATCA e-invoicing (Fatoora)

**Port**: `EInvoiceService.issue(InvoiceRequest)` returns the invoice number stored in `orders.invoice_number`.

**To do**
1. Register the solution with ZATCA (onboarding, CSR, compliance CSID, production CSID).
2. Build UBL 2.1 XML (simplified tax invoice for B2C), cryptographic stamp, QR code (TLV base64), previous-invoice hash chain (PIH) and invoice counter (ICV).
3. Report simplified invoices within 24 hours (or clear standard invoices in real time for B2B).
4. Store XML, hash, QR and ZATCA status in a new table `invoices` (new Flyway migration) and email/download the PDF.
5. Totals: `net_halalas + vat_halalas = total_halalas`, VAT 15%.
6. Credit notes for refunds.
Check the current ZATCA technical specification before building; it changes.
