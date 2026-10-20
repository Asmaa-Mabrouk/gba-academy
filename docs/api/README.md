# API reference (v1)

Base URL: `/api/v1`. JSON. Auth: `Authorization: Bearer <jwt>` (token from login/register). Errors: `{ "code": "snake_case" }` with an HTTP status; the web app translates the code. JSON shapes equal the types in `apps/web/src/lib/types.ts`. Money = integer halalas, VAT included.

## Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/courses` | Query: `q`, `audience` (kids/youth/experts), `level`, `topic`, `mode` (recorded/live/blended), `freeOnly`, `sort` (popular/rating/newest/priceAsc/priceDesc). Returns `Course[]` with offerings and live sessions. |
| GET | `/courses/{slug}` | `Course` or 404 `not_found` |
| GET | `/courses/{slug}/reviews` | `Review[]`, newest first |
| GET | `/mentors`, `/mentors/{slug}` | `Mentor` |
| POST | `/auth/register` | Body `RegisterInput`. 409 `email_exists`, 400 `weak_password`. Returns `{token, user}` |
| POST | `/auth/login` | `{email, password}`. 401 `invalid_credentials`. Returns `{token, user}` |

## Signed in

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/me` | Current `User`. 401 `unauthorized` |
| POST | `/orders` | `{ lines:[{offeringId}], paymentMethod: mada\|applepay\|card }`. Prices are read from the DB. Charges via `PaymentGateway`, issues invoice via `EInvoiceService`, creates enrollments. 402 `payment_failed`, 409 `sold_out`. Returns `Order` |
| GET | `/me/enrollments` | `Enrollment[]` (progress, next live session, certificate code) |
| POST | `/me/enrollments/{slug}/lessons/{lessonId}/complete` | Marks lesson done, recomputes progress, issues certificate code at 100%. 403 `not_enrolled` |
| POST | `/courses/{slug}/reviews` | `{rating 1-5, comment}`. Only enrolled learners (403 `not_enrolled`) |

## Admin (role `admin`, 401 if not signed in, 403 `forbidden` otherwise)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/stats` | Dashboard numbers: users, courses, mentors, enrollments, paid orders, revenue, upcoming sessions, top courses |
| GET | `/admin/courses`, `/admin/courses/{id}` | All courses including unpublished (`published:false`) |
| POST | `/admin/courses` | Create. Body = `Course` shape with `offerings[].sessions[]`. 409 `slug_exists`, 400 `invalid_slug`/`missing_*`/`unknown_mentor`/`invalid_price`/`invalid_seats` |
| PUT | `/admin/courses/{id}` | Replace course, offerings and sessions in one call. Ids are kept (sessions keep `seats_taken`); dropped sessions are deleted; an offering that has orders or enrollments cannot be deleted (409 `offering_in_use`) |
| PUT | `/admin/courses/{id}/published` | `{published:boolean}` hides or shows the course for learners |
| GET/POST/PUT | `/admin/mentors`, `/admin/mentors/{id}` | Mentor profile. `userEmail` links the profile to a login account and gives that account the `mentor` role |
| GET | `/admin/users` | Latest 500 users with roles |
| PUT | `/admin/users/{id}/roles` | `{roles:["learner","mentor","admin"]}`. `learner` is always kept; you cannot remove your own admin role |
| GET | `/admin/orders` | Latest 200 orders with buyer and lines |
| GET | `/admin/reviews` | All reviews |
| DELETE | `/admin/reviews/{id}` | Removes the review and adjusts course and mentor rating |
| PUT | `/admin/reviews/{id}/reply` | `{ar,en}` to set the mentor reply, `{}` to clear |

## Mentor (role `mentor` and a linked mentor profile; 403 `forbidden` / `no_mentor_profile`; other mentors' data is 404)

| Method | Path | Notes |
| --- | --- | --- |
| GET, PUT | `/mentor/me` | Own profile (name, title, bio, expertise, languages, hue) |
| GET | `/mentor/stats` | Learners, courses, rating, upcoming sessions, gross sales and per-course breakdown |
| GET | `/mentor/courses`, `/mentor/courses/{id}` | Own courses (published or not) |
| PUT | `/mentor/courses/{id}` | Content and sessions only (see docs/admin.md). Prices, slug, audience, publishing and offerings in the body are ignored. 400 `seats_below_taken` |
| GET | `/mentor/sessions` | Upcoming sessions with enrolment counts |
| GET | `/mentor/sessions/{id}/join` | `{url}` from `LiveVideo.joinLink` |
| GET | `/mentor/learners` | Names and progress, no contact details |
| GET | `/mentor/reviews` | Reviews of own courses |
| PUT | `/mentor/reviews/{id}/reply` | `{ar,en}` or `{}` to clear |

## Health

`GET /actuator/health`.

## Not built yet (planned)

Password reset, email verification, mentor payouts, refunds, course deletion, certificate verification page (`/certificates/{code}`), protected video playback URL (`VideoHosting`) and live join link (`LiveVideo`) endpoints, guardian-to-child profiles.
