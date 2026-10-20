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

## Health

`GET /actuator/health`.

## Not built yet (planned)

Password reset, email verification, mentor/admin back-office endpoints, refunds, certificate verification page (`/certificates/{code}`), protected video playback URL (`VideoHosting`) and live join link (`LiveVideo`) endpoints, guardian-to-child profiles.
