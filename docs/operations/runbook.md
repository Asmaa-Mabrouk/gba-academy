# Runbook

## Environments and config

| Variable | Where | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_API_MODE` | web | `mock` or `http` |
| `NEXT_PUBLIC_API_URL` | web | e.g. `https://api.example.com/api/v1` |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | api | PostgreSQL |
| `JWT_SECRET` | api | 32+ random characters. Required in production |
| `CORS_ORIGINS` | api | Comma-separated web origins |

## Run locally
See the root README. Reset the database: drop and recreate `gba`; Flyway rebuilds schema and sample data on start.

## Deploy
Build the two Docker images (`apps/web/Dockerfile`, `services/api/Dockerfile`), run them behind HTTPS with a managed PostgreSQL. Back up the database daily. Remove `V2__sample_data.sql` effects in production (or move sample data to a dev-only Flyway location) before loading real courses.

## Troubleshooting
- Web shows no courses in http mode: check `NEXT_PUBLIC_API_URL`, CORS_ORIGINS and `GET /actuator/health`.
- 401 after login: `JWT_SECRET` changed or token expired (24 h).
- Flyway checksum error: someone edited an applied migration. Revert it and add a new one.
- Regenerate sample data: `node --experimental-strip-types scripts/generate-seed.mjs` (only for fresh databases).
