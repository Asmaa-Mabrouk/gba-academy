# Global Business Academy

The learner-facing academy website (Front 5 of the GPMF Digital Ecosystem): register, log in, explore courses (recorded, live and blended), buy, learn, rate mentors. Arabic first (RTL), English second. Three audience tracks: Kids, Youth, Experts.

| Part | Tech | Folder |
| --- | --- | --- |
| Website | TypeScript, Next.js 16 (App Router), React 19, Tailwind 4 | `apps/web` |
| API | Java 21, Spring Boot 3.4, Spring JDBC, Flyway | `services/api` |
| Database | PostgreSQL 16 | migrations in `services/api/src/main/resources/db/migration` |
| Docs | Markdown | `docs/` (start at [docs/README.md](docs/README.md)) |

## Run it in 60 seconds (no backend needed)

```bash
cd apps/web
cp .env.example .env.local        # NEXT_PUBLIC_API_MODE=mock
npm install
npm run dev                       # http://localhost:3000  (redirects to /ar)
```

Mock mode uses built-in sample data and the browser's localStorage. Demo login: `learner@demo.sa` / `Demo@1234`.

## Run the full stack

```bash
docker compose up --build         # db + api (8080) + web (3000)
```

Or without Docker: start PostgreSQL, create database `gba` (user/password `gba`), then `cd services/api && mvn spring-boot:run` and run the web app with `NEXT_PUBLIC_API_MODE=http`.

## Status

See [docs/product/status.md](docs/product/status.md) for what is done, what is faked and what a developer must still do (payment, ZATCA, video, real content).
