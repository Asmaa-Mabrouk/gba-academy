# Roles, one login, and the admin portal

## One login, several interfaces
Everyone signs in on the same page. The account's `roles` (stored in `users.roles`) decide what opens:

| Role | Gets |
| --- | --- |
| `learner` (everyone) | Public site, cart, My courses, learning page |
| `mentor` | Mentor portal at `/ar/mentor` or `/en/mentor` |
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

## Mentor portal
A mentor signs in with the same login. The account needs the `mentor` role **and** a mentor profile linked to it (Admin > Mentors > "Linked login account"). Without a profile the portal shows "not linked" and asks them to contact the admin. Every mentor API call is scoped to the linked profile (`MentorPortalController.mentorId`), and another mentor's course returns 404.

| Screen | What the mentor does |
| --- | --- |
| Overview | Learners, courses, rating, upcoming sessions, gross sales per course (VAT included, before any platform share; the payout rule is not defined yet) |
| My courses | Edit title, subtitle, description, outcomes, syllabus, hours, age range, languages, and the live sessions of existing live/blended offerings (date, duration, seats, title). **Read-only:** price, slug, audience, topic, flags, publishing, offerings added or removed (admin only) |
| My live sessions | Upcoming sessions with enrolment count and a host join link from the `LiveVideo` adapter |
| Learners | Name, course, format, progress, completion. **No emails or phone numbers**; guardian accounts are flagged |
| Reviews | Reply to reviews of their own courses (cannot delete) |
| My profile | Name, title, bio, expertise, languages, avatar colour |

Rules enforced by the API: seats cannot be lowered below the seats already taken (`seats_below_taken`); lessons keep their ids so learner progress is not lost.

Code: web `components/mentor/*`, `lib/mentor-api.ts`, pages `app/[locale]/mentor/*` (the course editor is the admin `CourseEditor` with `restricted`); API `services/api/.../mentor/MentorPortalController.java`; shared writing rules in `common/CourseWriter.java`.

## Ideas for later
Mentor payouts and statements, mentors proposing a new course for admin approval, announcements to enrolled learners, attendance for live sessions, mentor analytics (completion rate by lesson).
