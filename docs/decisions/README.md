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
