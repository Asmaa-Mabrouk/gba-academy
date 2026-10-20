# Architecture review (October 2026)

Scope: database, API, web, delivery. Verdicts are **Done** (in the repo now), **Next** (do before launch traffic) or **Later** (when numbers justify it).

## What is already sound
- Offerings separate from courses; money as integer halalas; stateless JWT API; all vendors behind ports with fake adapters; one `api.ts` boundary in the web; bilingual typed dictionaries; Flyway-only schema changes.

## Done in this pass
| Area | Change | Why |
| --- | --- | --- |
| DB | `V5__scale_and_integrity.sql` | Indexes on every foreign key and hot query; partial index for published courses |
| DB | Unique index on `lower(email)` | Login looks up by `lower(email)`; two accounts differing only in case are now impossible |
| DB | `pg_trgm` GIN indexes on title and subtitle | `ILIKE '%x%'` search stops scanning the whole table |
| DB | CHECK constraints (order totals = subtotal + VAT, progress 0-100, seats never oversold, ratings 0-5, no negative prices) | Integrity does not depend on every code path being correct |
| API | Hikari pool limits and 5 s connection timeout | Saturation fails fast |
| API | Virtual threads, graceful shutdown, response compression, liveness/readiness probes | Safe deploys and scale-out behind a load balancer |
| Web | `error.tsx` | Failed renders show a retry, not a blank page |
| Delivery | GitHub Actions CI (web, api, database) and Dependabot | Every change is built and tested; dependencies stay current |
| Test | `scripts/db-check.sh` + `qa/db-scenarios.sql` | Applies V1..V5 to a fresh PostgreSQL and proves each rule rejects bad data |

## Next (before launch)
1. **Rate limiting** on login, register and payment endpoints (per IP and per e-mail). Needed against credential stuffing.
2. **Idempotent checkout**: accept an `Idempotency-Key`, so a double click or retry cannot create two orders. Order creation and seat decrement must stay in one transaction.
3. **Outbox table** for side effects (e-invoice, e-mail/SMS). Write the event in the order transaction, a worker delivers it with retries. Required once real ZATCA is connected.
4. **Pagination** on admin lists and reviews (keyset on `created_at, id`). Catalogue is small now; admin lists are not bounded.
5. **Observability**: JSON logs with a request id, Micrometer metrics, error tracking, DB slow-query log.
6. **Backups**: managed PostgreSQL with point-in-time recovery; test a restore.
7. **Secrets** from the platform secret store (JWT, DB, vendors); rotate the dev defaults.

## Later (when numbers justify)
- HTTP caching (ETag / Cache-Control) or a CDN in front of public catalogue endpoints.
- Read replica for reporting; materialised views for admin dashboards.
- Audit log table for admin actions; mentor payout ledger (rule still to be defined by the business).
- Video and certificate files on object storage + CDN, not the API.
- Split the API only if a module (payments, messaging) needs independent scaling; stay a modular monolith until then.

## Scaling model
The API is stateless, so scale horizontally. Limit per instance: `DB_POOL_MAX` (default 10). Keep `instances x pool` under Postgres `max_connections` (use PgBouncer beyond ~10 instances). Postgres is the first bottleneck; scale it up, then add a replica.

## Known limits of this review
The Java code could not be compiled in the review environment (Maven Central unreachable), so only SQL and web changes were executed. Only YAML configuration changed in Java land. Run `mvn test` locally or in CI before release.
