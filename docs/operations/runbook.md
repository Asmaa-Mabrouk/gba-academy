# Runbook

## Environments and config

| Variable | Where | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_API_MODE` | web | `mock` or `http` |
| `NEXT_PUBLIC_API_URL` | web | e.g. `https://api.example.com/api/v1` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | api | PostgreSQL |
| `JWT_SECRET` | api | 32+ random characters. Required in production |
| `CORS_ORIGINS` | api | Comma-separated web origins |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | api | Creates the first admin at start-up (or grants admin to an existing account with that email). Remove the password variable afterwards |

## Run locally
See the root README. Reset the database: drop and recreate `gba`; Flyway rebuilds schema and sample data on start.

## Deploy
Build the two Docker images (`apps/web/Dockerfile`, `services/api/Dockerfile`), run them behind HTTPS with a managed PostgreSQL. Back up the database daily. Remove `V2__sample_data.sql` effects in production (or move sample data to a dev-only Flyway location) before loading real courses.

## Troubleshooting
- Web shows no courses in http mode: check `NEXT_PUBLIC_API_URL`, CORS_ORIGINS and `GET /actuator/health`.
- 401 after login: `JWT_SECRET` changed or token expired (24 h).
- Flyway checksum error: someone edited an applied migration. Revert it and add a new one.
- Regenerate sample data: `node --experimental-strip-types scripts/generate-seed.mjs` (only for fresh databases).

## Health, scaling and checks
- Probes: `/actuator/health/liveness` and `/actuator/health/readiness`. Shutdown is graceful (25 s).
- Pool: `DB_POOL_MAX` (default 10), `DB_POOL_MIN` (default 2). Keep instances x pool below Postgres `max_connections`.
- Migration check: `PGUSER=postgres ./scripts/db-check.sh` against any PostgreSQL 16 server.
- Review and roadmap: `docs/architecture-review.md`.
