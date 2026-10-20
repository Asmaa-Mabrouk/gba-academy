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
- **Courses**: create or edit everything about a course in one page: basics, bilingual texts, outcomes, syllabus, course files, and offerings (recorded / live / blended) with prices, **capacity** and **minimum learners** (live and blended) and live sessions (date in Riyadh time, duration, meeting link). Publish or hide a course. Prices are typed in SAR, VAT included, and stored in halalas. A course a mentor sent shows an **Approve / Send back** bar; the list can be filtered to pending courses and the overview shows how many wait.
- **Lessons** are added one at a time in a short bubble flow: *Basics* (title, minutes, type) > *Content* (upload a video or paste a YouTube/Vimeo/MP4 link; or design a **quiz**: questions, options, correct answer, explanation, pass mark) > *Files* (PDF and Office attachments) > *Review* (checklist). Lessons can be moved up and down.
- **Live sessions**: leave the link empty and the platform creates a Google Meet link when you save (if `academy.integrations.live=google-meet`); or paste your own https link (Meet, Zoom, Teams). Mentors and enrolled learners open it from the platform (My live sessions, the lesson page). See `integrations/video.md`.
- **Promo codes**: create a code with a discount percentage, a number of uses and an expiry date; switch it off any time. One use per learner. Learners enter it at checkout. A used code cannot be deleted, only deactivated.
- **Mentors**: profile, bilingual texts, **photo upload**, avatar colour, and the **linked login account** (user email). Linking gives that account the mentor role.
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
| My courses | **New course**: build a draft (all fields, lessons, videos, quizzes, files, proposed offerings and prices), then **Submit for approval**. Pending courses are read-only (withdraw to edit). A sent-back course shows the admin's note. Hidden from learners until approved. **Live course:** edit content, quizzes, files and live sessions; price, slug, audience, publishing and offerings stay admin only |
| My live sessions | Upcoming sessions with enrolment count and a host join link from the `LiveVideo` adapter |
| Learners | Name, course, format, progress, completion. **No emails or phone numbers**; guardian accounts are flagged |
| Reviews | Reply to reviews of their own courses (cannot delete) |
| My profile | Name, title, bio, expertise, languages, photo, avatar colour |

Approval flow: `draft` > `pending` > `approved` or `rejected` (back to the mentor with a note). Only `approved` courses can be published (database constraint). Rules enforced by the API: capacity cannot be lowered below the learners already enrolled (`capacity_below_enrolled`); seats cannot be lowered below the seats already taken (`seats_below_taken`); lessons keep their ids so learner progress is not lost.

Code: web `components/mentor/*`, `lib/mentor-api.ts`, pages `app/[locale]/mentor/*` (the course editor is the admin `CourseEditor` with `restricted`); API `services/api/.../mentor/MentorPortalController.java`; shared writing rules in `common/CourseWriter.java`.

## Ideas for later
Mentor payouts and statements, announcements to enrolled learners, attendance for live sessions, mentor analytics (completion rate by lesson).
