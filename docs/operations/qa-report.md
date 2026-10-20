# QA report

Suite: `qa/e2e.py` (Python + Playwright, mock mode, 207 checks). Run: build and start web on :3100, then `python3 qa/e2e.py`. Expected catalogue numbers come from `qa/expected.mjs` (computed from the mock data, so the suite follows the data).

## Result (2026-10-20): 207 / 207 pass

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

## Defects found and fixed
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
