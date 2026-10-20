# API reference (v1)

Base URL: `/api/v1`. JSON. Auth: `Authorization: Bearer <jwt>` (token from login/register). Errors: `{ "code": "snake_case" }` with an HTTP status; the web app translates the code. JSON shapes equal the types in `apps/web/src/lib/types.ts`. Money = integer halalas, VAT included.

## Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/courses` | Query: `q`, `audience` (kids/youth/experts), `level`, `topic`, `mode` (recorded/live/blended), `freeOnly`, `sort` (popular/rating/newest/priceAsc/priceDesc). Returns `Course[]` with offerings and live sessions. |
| GET | `/courses/{slug}` | `Course` or 404 `not_found` |
| GET | `/courses/{slug}/reviews` | `Review[]`, newest first |
| GET | `/mentors`, `/mentors/{slug}` | `Mentor` |
| POST | `/auth/register` | Body `RegisterInput`. 409 `email_exists`, 400 `weak_password`, 400 `terms_required` (body needs `acceptedTerms: true` and `termsVersion`; stored in `user_consents`). Returns `{token, user}` |
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
| POST | `/mentor/courses` | New course as a **draft** (hidden, `status=draft`). Mentor is taken from the login |
| PUT | `/mentor/courses/{id}` | `draft` / `rejected`: full save except publish flags. `pending`: 409 `pending_review`. `approved`: content, quizzes, materials and live sessions only; prices, slug, audience and offerings in the body are ignored |
| POST | `/mentor/courses/{id}/submit` | Draft or rejected to `pending`. 400 `incomplete_course` (title, a lesson and an offering needed) or `quiz_incomplete`. Admins are notified |
| POST | `/mentor/courses/{id}/withdraw` | Pending back to draft |
| PUT | `/mentor/me` | Also accepts `imageUrl` (an `/api/v1/files/...` upload or https link) |
| GET | `/mentor/sessions` | Upcoming sessions with enrolment counts |
| GET | `/mentor/sessions/{id}/join` | `{url}`; creates the meeting first if the session has none (`CourseWriter.ensureMeeting`) |
| GET | `/mentor/learners` | Names and progress, no contact details |
| GET | `/mentor/reviews` | Reviews of own courses |
| PUT | `/mentor/reviews/{id}/reply` | `{ar,en}` or `{}` to clear |

## Admin: approval, promo codes, meetings

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/admin/courses/{id}/approve` | `{publish:true}` (default). Pending to approved, optionally visible; mentor is messaged |
| POST | `/admin/courses/{id}/reject` | `{note}` required (`missing_note`). Back to the mentor with the reason |
| POST | `/admin/sessions/{id}/meeting` | Creates the meeting link for a session that has none. 503 `meeting_unavailable` |
| GET, POST | `/admin/promos` | List, create. `{code, percentOff 1-100, maxUses|null, expiresAt|null, active, note}`. 409 `code_exists` |
| PUT, DELETE | `/admin/promos/{id}` | Code cannot change. `max_uses_below_used`; delete refused once used (`promo_in_use`), deactivate instead |

## Announcement banners

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/banners` | Public. Only banners that are active and inside their dates, ordered by `sortOrder` |
| GET, POST | `/admin/banners` | List all, create. `{title{ar,en}, subtitle, ctaLabel, linkUrl (https or /path), imageUrl, theme navy|gold|teal|violet, startsAt, endsAt, active, sortOrder}`. 400 `invalid_link`, `invalid_theme`, `missing_title` |
| PUT, DELETE | `/admin/banners/{id}` | Update or delete |

## Files

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/uploads` | Multipart `file` + `kind` (`image` 5 MB, `document` 25 MB, `video` 500 MB). Admin or mentor. Type is checked by content, not by name. 413 `file_too_large`, 415 `unsupported_file_type` |
| GET | `/files/{id}` | Images are public. Videos and documents need the signed-in user (header or `?t=<jwt>` for `<video>` and downloads): admin, uploader, mentor of a course that uses it, or an enrolled learner. Supports HTTP Range |

## Learner additions

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/promo/validate` | `{code, offeringIds}` gives `{code, percentOff, grossHalalas, discountHalalas, totalHalalas}`. Errors `promo_invalid`, `promo_inactive`, `promo_expired`, `promo_exhausted`, `promo_used` |
| POST | `/orders` | Body may include `promoCode`. The discount is a percentage of the VAT-inclusive total; 100% makes the order free. Order JSON has `promoCode`, `discountHalalas`. 409 `sold_out` also when an offering reached its `capacity` |
| GET | `/me/enrollments/{slug}/content` | Modules with lesson `video`, `materials`, `hasQuiz`, plus course `materials`. Public course JSON leaves these out |
| GET, POST | `/me/enrollments/{slug}/lessons/{lessonId}/quiz` | GET: questions without answers. POST `{answers:{questionId:optionId}}`: graded on the server, returns score and per-question result; passing completes the lesson. `complete` on a lesson with a quiz returns 400 `quiz_required` |
| GET | `/me/sessions/{id}/join` | `{url}` for an enrolled learner (`not_enrolled` otherwise) |

## Health

`GET /actuator/health`.

## Not built yet (planned)

Password reset, email verification, mentor payouts, refunds, course deletion, certificate verification page (`/certificates/{code}`), guardian-to-child profiles.
