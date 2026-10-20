# Status

## Done
- Web: home with three audience tracks, catalogue with filters, course page with offerings, mentors and reviews, login/register with the animated GPMF flower, cart, checkout (demo payment), my courses, learning page, Arabic and English, RTL.
- API: schema, sample data, auth, catalogue, orders, enrollments, progress, reviews, fake integrations, VAT unit test.
- Admin portal (web + API): dashboard, courses with offerings and live sessions, mentors, user roles, orders, review moderation. One login with role-based interfaces (see docs/admin.md).
- Docs, Docker setup.

## Faked or placeholder
- Payment, ZATCA invoices, video, live room, emails (fake adapters, see `docs/integrations`).
- Mentors, courses, reviews and prices are invented sample data.
- Course covers are generated; the Arabic academy name is a placeholder; logo is the supplied PNG (SVG wanted).

## Not built yet
Password reset and email verification, mentor portal (planned next, same login), certificate verification page and PDF, guardian-to-child profiles, refunds, coupons, notifications for live sessions, analytics, accessibility audit, automated API integration tests.

## Verification notes
- Web: type-checked and production-built; pages load in a browser in both languages.
- Database: schema and seed run on PostgreSQL 16; catalogue SQL tested.
- **Java API has not been compiled or run** (the build environment could not download Maven dependencies). First step for the developer: `cd services/api && mvn test && mvn spring-boot:run`, then fix any compile errors.
