# Status

## Done
- Web: home with three audience tracks, catalogue with filters, course page with offerings, mentors and reviews, login/register with the animated GPMF flower, cart, checkout (demo payment), my courses, learning page, Arabic and English, RTL.
- API: schema, sample data, auth, catalogue, orders, enrollments, progress, reviews, fake integrations, VAT unit test.
- Admin portal (web + API): dashboard, courses with offerings and live sessions, mentors, user roles, orders, review moderation. One login with role-based interfaces (see docs/admin.md).
- Mentor portal (web + API): overview and sales, own courses (content and sessions), live sessions with join link, learners (no contact data), review replies, profile.
- Authoring and approval: mentors create draft courses and submit them; admins approve or send back with a note. Lesson wizard, video upload or link, quiz designer, lesson and course files, offering capacity and minimum, live-session meeting links (manual or Google Meet through the `LiveVideo` port).
- Promo codes (admin) with checkout support, mentor photos, upload pipeline (`FileStorage`).
- Home announcement slider managed from the admin (V7).
- Kids world page (`/kids`): hero avatar, XP and levels, missions, projects, Hero Board (device-only, see docs/kids.md).
- Docs, Docker setup.

## Faked or placeholder
- Payment, ZATCA invoices, video, live room, emails (fake adapters, see `docs/integrations`).
- Mentors, courses, reviews and prices are invented sample data.
- Course covers are generated; the Arabic academy name is a placeholder; logo is the supplied PNG (SVG wanted).

## Not built yet
Password reset and email verification, mentor payouts and statements, certificate verification page and PDF, guardian-to-child profiles with server-side kids XP, projects moderation and leaderboard, refunds, notifications for live sessions, Meet recordings and attendance, object-storage adapter for uploads, analytics, accessibility audit, automated API integration tests.

## Verification notes
- Web: type-checked and production-built; pages load in a browser in both languages.
- Database: schema and seed run on PostgreSQL 16; catalogue SQL tested.
- Web and mock mode: `qa/e2e.py` (221 checks) and `qa/e2e-features.py` (new features) both run against a production build.
- Database: `scripts/db-check.sh` applies V1 to V8, runs `qa/db-scenarios.sql`, and `qa/sql-smoke.py` parses every SQL text block of the Java code against the real schema.
- **Java API has not been compiled or run** (the build environment could not download Maven dependencies). First step for the developer: `cd services/api && mvn test && mvn spring-boot:run`, then fix any compile errors.
