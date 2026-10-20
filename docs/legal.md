# Legal pages, consent and placeholder content

## Pages
`/{ar|en}/legal/terms`, `/privacy`, `/refund`. Text lives in `apps/web/src/lib/dict/legal.ts` (ar and en, same order).
**It is template text. Legal counsel must review it before launch.**

## Consent
- Registration requires accepting Terms + Privacy (checkbox with links, clear error). Marketing is a separate optional checkbox.
- Checkout requires accepting Terms + Refund policy before paying.
- API: `POST /auth/register` needs `acceptedTerms: true` and `termsVersion`. Rows go to `user_consents` (migration V4): document, version, accepted_at. Bump `TERMS_VERSION` in `lib/placeholders.ts` when the text changes.
- Mock mode stores the same record on the stored user.

## Placeholder content (replace, then set `DRAFT_CONTENT = false`)
All in `apps/web/src/lib/placeholders.ts`: commercial registration, VAT number, training licence (all fake), contact details, the founder block (name, role, photo, signature image).
While `DRAFT_CONTENT` is true the UI shows "Sample data" on the footer, legal pages and certificate, and a "sample wording" note under the founder quote.
The founder quote (`hero.quote` in `dict/ar.ts` and `en.ts`) is DRAFT wording written by us. It must be approved by Mr. Badr Burshaid before launch.
Signature: drop a PNG (transparent background) into `public/brand/` and set `FOUNDER.signatureImage`. Mentor signatures need a `signatureUrl` on the mentor profile (not built yet; currently a generated placeholder scribble).

## Slogan
Current: AR "تعلّم بالمشاريع. قُد المستقبل." / EN "Learn by doing. Lead what's next." (`brand.tagline`, `hero.slogan`).
Why: GPMF's identity is project management; the academy's pedagogy is learning through projects; "lead" fits the kids / youth / experts ladder.
Alternatives: "من المشروع إلى الأثر" / "From project to impact"; "ابدأ صغيرًا. أنجز كبيرًا." / "Start small. Deliver big."; "تعلّم. طبّق. تميّز." / "Learn. Apply. Excel."
Encouragement lines: `encourage[]` in the dictionaries (shown on My courses and after payment).

## Certificate
`/{locale}/certificate/{code}` (owner only). Printable A4 landscape (Print / Save as PDF). Shows learner, course, hours, CPD, date, verification code, academy stamp (SVG), mentor signature slot and academy management signature slot.
TODO for the developer: public verification endpoint by code (`GET /certificates/{code}`), real signature images, official stamp artwork.
