# Roles, one login, and the admin portal

## One login, several interfaces
Everyone signs in on the same page. The account's `roles` (stored in `users.roles`) decide what opens:

| Role | Gets |
| --- | --- |
| `learner` (everyone) | Public site, cart, My courses, learning page |
| `mentor` | Mentor portal (planned, see below) |
| `admin` | Admin portal at `/ar/admin` or `/en/admin` |

After login the web app lands an admin on `/admin` and everyone else on My courses (`lib/portals.ts`, `landingFor`). The header shows a button for each portal the user has. An account can have several roles. The API checks the role on every admin call (`auth/Roles.java`), reading it from the database, so changing a role applies at once; hiding a menu item is never the only protection.

## First admin
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the API. At start-up `AdminBootstrap` creates that account, or grants the admin role to an existing account with that email. Further roles are given in Admin > Users.

## What the admin portal does
- **Overview**: revenue, orders, enrollments, users, upcoming sessions, most enrolled courses.
- **Courses**: create or edit everything about a course in one page: basics, bilingual texts, outcomes, syllabus (modules and lessons), and offerings (recorded / live / blended) with prices and live sessions (date in Riyadh time, duration, seats). Publish or hide a course. Prices are typed in SAR, VAT included, and stored in halalas.
- **Mentors**: profile, bilingual texts, avatar colour, and the **linked login account** (user email). Linking gives that account the mentor role.
- **Users**: tick or untick Mentor and Admin per user.
- **Orders**: read-only list with VAT and invoice number.
- **Reviews**: reply as the mentor, or delete a review (ratings adjust).

## Mock mode
Without the API (`NEXT_PUBLIC_API_MODE=mock`) the admin works on a copy of the sample data in the browser. Demo logins: `admin@demo.sa` / `Admin@1234`, `mentor@demo.sa` / `Mentor@1234`, `learner@demo.sa` / `Demo@1234`. Changes do not appear on learner pages because those are rendered on the server from the built-in data.

## Where the code is
- Web: `apps/web/src/components/admin/*` (`AdminShell` guards and draws the sidebar), pages in `src/app/[locale]/admin/*`, API client `src/lib/admin-api.ts`, texts `src/lib/dict/admin.ts`.
- API: `services/api/.../admin/*` (`AdminCourseController`, `AdminPeopleController`, `AdminOpsController`, `RatingService`, `AdminBootstrap`), migration `V3__admin_support.sql`.

## Planned: mentor portal
Same pattern as admin, role `mentor`: `Roles.require(req, "mentor")`, a `/mentor` area with `MentorShell`, and endpoints that only touch courses whose `mentor_id` belongs to the mentor linked to the logged-in user (`mentors.user_id`). Screens: my courses (edit texts and syllabus, not prices unless allowed), my live sessions, my learners, review replies, earnings. Switch on `MENTOR_PORTAL_READY` in `lib/portals.ts` when it is built.
