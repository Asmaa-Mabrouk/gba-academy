# QA report

Suites (Python + Playwright, mock mode): `qa/e2e.py` (221 checks: public, auth, commerce, admin, mentor, mobile, quality, design) and `qa/e2e-features.py` (new features, see below). Run: build and start web on :3100, then `python3 qa/e2e.py` and `python3 qa/e2e-features.py`. Database: `scripts/db-check.sh` (needs PostgreSQL; also runs `qa/sql-smoke.py`). Expected catalogue numbers come from `qa/expected.mjs` (computed from the mock data, so the suite follows the data).

## Result (2026-10-20): see the end of this file for the latest run

| Area | Checks | Covers |
|---|---|---|
| A Public | catalogue filters, sort, search, 404s, hostile query strings, every course and mentor page, i18n and fonts | |
| B Auth | validation, duplicates, case-insensitive login, `?next=` (and open-redirect block), roles and portals landing, guards | |
| C Commerce | cart rules, VAT split, card and terms validation, pay, repeat purchase refused, free course, learning to 100%, progress, certificate, reviews | |
| D Admin | dashboard, course create/edit/hide, slug rules, mentors, role changes, reviews, orders, mentor linking | |
| E Mentor | own-courses scoping, restricted editor, sessions, learners without contact data, reply, profile | |
| F Mobile | 390 px and 820 px overflow on public, admin and mentor pages, mobile menu | |
| G Quality | a11y basics, 69-link crawl, console errors, header leak, load time | |
| H Design/UX | cream surfaces, hero, legal pages, consent, inline errors, toasts, focus | |

## New features suite (`qa/e2e-features.py`)
| Area | Covers |
|---|---|
| N Announcements | slider on home (links open safely in a new tab, arrows, dots), admin create with live preview, `javascript:` link rejected, end-before-start rejected, ended banners hidden, Arabic text, delete |
| P Promo codes | generated code, upper-casing, percent bounds, duplicate, expired, inactive, used counts, used codes cannot be deleted |
| C Checkout | unknown, expired and inactive codes refused, 20% applied, one use per learner, 100% free order |
| E Course editor | missing-field messages, 4-step lesson bubbles, quiz designer, move lesson, capacity and minimum, meeting link (manual), persistence, minimum above capacity refused |
| M Approval | mentor draft, incomplete submit refused, pending read-only, withdraw, admin review bar, send back needs a note, mentor sees the note, approve publishes, approved course is restricted for the mentor |
| L Learner quiz | quiz panel instead of mark-done, answers hidden, answer-all rule, fail then pass completes the lesson |
| H Photo | mentor photo upload, list avatar, removal |
| K Kids | avatar builder, XP, missions, badges, projects, cheers, Hero Board, persistence, safety text, RTL and mobile, menu link |

What these cannot cover: the Java API (never compiled here), real file upload to the server, real Google Meet. Those need the developer's `mvn test`, a run with `NEXT_PUBLIC_API_MODE=http`, and the Google credentials.

## Defects found and fixed
0. Route-level `loading.tsx` made unknown pages answer 200 instead of 404 (4 checks failed). Removed.
1. Repeat purchase of an owned course charged twice. Now 409 `already_enrolled` (Java and mock).
2. Free orders went through the payment gateway and got an invoice. Now no charge, no invoice.
3. English home page scrolled sideways on phones (grid children without `min-w-0`).
4. Admin and mentor portals overflowed sideways on phones in Arabic (grid column grew to the nav width).
5. Admin reviews did not include reviews posted by learners in demo mode.
6. `X-Powered-By: Next.js` header exposed (disabled).
7. Language switch dropped the query string (filters lost).
8. Inline validation errors shifted the layout and made the next click miss. The error slot is now reserved.
9. First invalid field was not focused after a failed submit (focus ran before render).
10. Password "Show" button overlapped the text in Arabic (RTL page, LTR input).

## Not covered / open
- Java API was never compiled or run here (Maven Central is blocked). Developer: `mvn test`, `mvn spring-boot:run`, then run this suite with `NEXT_PUBLIC_API_MODE=http`.
- Intermittent React #418 hydration warning seen once before; not reproduced in this run (0 console errors). Investigate with `next dev` if it returns.
- No automated visual-regression or screen-reader testing yet.
