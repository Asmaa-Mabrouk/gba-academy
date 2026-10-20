# CLAUDE.md: instructions for AI assistants and new developers

Read `docs/README.md` first. Key rules:

- Monorepo: `apps/web` (Next.js, TypeScript), `services/api` (Spring Boot, Java 21), `docs/`.
- UI text lives ONLY in `apps/web/src/lib/dict/ar.ts` and `en.ts` (same keys; `en` is typed against `ar`). Never hard-code UI strings in components. Arabic is the default language.
- Domain content is bilingual: `{ ar, en }` (`Bilingual` type). Use `tr(value, locale)`.
- Money is an integer in halalas. Displayed prices include 15% VAT. VAT split lives in `Pricing.java` and `CartView.tsx`.
- A Course never holds a price or date. Those live on Offerings (recorded / live / blended) and their live sessions.
- The web talks to the backend only through `apps/web/src/lib/api.ts` (mock or http mode). Add new endpoints there and in `docs/api/`.
- Payment, ZATCA, video, live video and messaging are PORTS in `services/api/.../integrations`. Fake adapters are the default. Do not call vendors from controllers.
- Brand tokens are in `apps/web/src/app/globals.css` (`@theme`). Fonts: Tajawal (Arabic), Roboto (Latin).
- Sample data: edit `apps/web/src/lib/mock-data.ts`, then run `node --experimental-strip-types scripts/generate-seed.mjs` to regenerate `V2__sample_data.sql`.
- Never edit an applied Flyway migration. Add a new `V<n>__name.sql`.
- One login, roles decide interfaces: `learner`, `mentor`, `admin` (`users.roles`). Every privileged API call must use `Roles.require(req, "<role>")`. Web guards are only convenience. See `docs/admin.md`.
- Kids safety: kids' courses are bought by a parent or guardian account. Do not collect personal data from children.
- Before finishing: `cd apps/web && npm run typecheck && npm run build`; `cd services/api && mvn test`.
