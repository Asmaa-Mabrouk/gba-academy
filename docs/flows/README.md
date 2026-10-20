# User flows

## Register and log in
```mermaid
sequenceDiagram
  actor L as Learner
  participant W as Web
  participant A as API
  L->>W: Fill form (self or "my child")
  W->>A: POST /auth/register
  A-->>W: token + user (BCrypt hash stored)
  W->>W: store token, go to My courses
```
Child accounts: the adult registers; a child profile under the guardian is planned (see status).

## Choose, pay, unlock
```mermaid
sequenceDiagram
  actor L as Learner
  participant W as Web
  participant A as API
  participant P as PaymentGateway
  participant Z as EInvoiceService
  L->>W: Pick offering (recorded / live / blended), add to cart
  W->>A: POST /orders (offering ids + method)
  A->>A: price from DB, check seats, VAT split
  A->>P: charge(total)
  P-->>A: success + reference
  A->>Z: issue invoice
  A->>A: save order, create enrollments, take seats
  A-->>W: Order (paid)
  W-->>L: Success, course unlocked
```

## Learn
My courses shows progress and the next live session. The learn page lists lessons; "mark as done" calls the complete endpoint. At 100% a certificate code is generated. Video and live room are placeholders until adapters exist.

## Review a mentor's course
Only enrolled learners can post a rating and comment; the course rating is recomputed. Mentor replies are stored in `reviews.mentor_reply` (mentor back-office is planned).

## Live session
Offering of mode `live` or `blended` has `live_sessions`. Seats decrease on purchase; `sold_out` when full. Joining: `LiveVideo.joinLink` (to be implemented).
