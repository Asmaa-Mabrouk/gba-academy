# Contributing

1. Branch from `main`, small PRs.
2. Web: `cd apps/web && npm run typecheck && npm run build`.
3. API: `cd services/api && mvn test`. New table or column means a new Flyway file.
4. New UI text goes into BOTH dictionaries. New endpoint goes into `lib/api.ts` (mock and http) and `docs/api/README.md`.
5. New decision? Add a file in `docs/decisions/`.
