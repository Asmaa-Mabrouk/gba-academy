# Decisions (ADRs)

| # | Decision | Why |
| --- | --- | --- |
| D1 | Monorepo with `apps/web`, `services/api`, `docs` | One place for the company to maintain |
| D2 | Offerings separate from courses | Same course sold recorded, live or blended with different price and dates |
| D3 | Ports and adapters for payment, ZATCA, video, messaging | Developer plugs real vendors without touching business code |
| D4 | Mock mode in the web app | Design and content work without the backend |
| D5 | Money in halalas, VAT included in shown prices | No rounding drift, Saudi B2C convention |
| D6 | JWT stateless auth, BCrypt | Simple to run and scale |
| D7 | Guardian-created accounts for children | Child safety and consent |
| D8 | Spring JDBC (JdbcClient) not JPA | SQL stays visible and reviewable; JSON assembled in PostgreSQL |
| D9 | Arabic default, `/ar` and `/en` URL prefixes | Arabic first market, good SEO per language |
| D10 | Database enforces integrity (CHECKs, case-insensitive unique e-mail) in V5 | The API is not the only writer; bad data must be impossible, not just unlikely |
| D11 | Trigram (`pg_trgm`) indexes for catalogue search before adding a search engine | Keeps one datastore until the catalogue is far larger |
| D12 | Virtual threads, graceful shutdown, small Hikari pool, health probes | Cheap scale-out for a blocking JDBC app on Java 21 |
| D13 | CI runs web build, `mvn test` and a real PostgreSQL migration check (`scripts/db-check.sh`) | Migrations and constraints are tested against the real engine on every change |
| D14 | Mentors create courses as drafts; an admin approves before anything is public (`status` plus a `published => approved` constraint) | Quality control without blocking mentors; the rule holds even if code changes |
| D15 | Capacity lives on the offering (`capacity`, `min_learners`) and is checked under a row lock at purchase | A live cohort of 10 must never sell 11, even with simultaneous buyers |
| D16 | Meeting links are created by the `LiveVideo` port (Google Meet adapter) and shown only to the mentor and enrolled learners | One click for staff, no links in public JSON, vendor replaceable |
| D17 | Uploads go through the `FileStorage` port; files are type-checked by content and served with an access check | Paid video must not be a public URL; storage can move to S3 later |
| D18 | Promo codes are a percentage of the VAT-inclusive total, one use per learner, validated and redeemed inside the order transaction | Simple for admins, no double use under load |
| D19 | Public course JSON omits lesson videos and files; enrolled learners fetch them from `/me/enrollments/{slug}/content` | The catalogue is public and cached; paid content is not |
