# Courses module: handoff for reuse in another website

Everything below already exists in this repository. A new project can take the module from GitHub
(`Asmaa-Mabrouk/gba-academy`) instead of rebuilding it from a description. Read `CLAUDE.md` and
`docs/README.md` first; they hold the rules the module depends on.

## 1. What the module covers

| Area | What it does |
|---|---|
| Browse | Catalogue with search, audience, level, topic, format and sort; course page with syllabus, mentor, reviews, capacity bar |
| Select | Offerings per course: recorded, live cohort or blended. A course holds no price or date; the offering and its live sessions do |
| Pay | Cart, checkout, promo codes, 15% VAT (prices include VAT), payment through a port, e-invoice through a port, order record, enrolment, certificate code at 100% |
| Learn | My courses, player (video upload or link, lesson files, course materials), quizzes graded on the server, live-session join link, certificate |
| Author (admin and mentor) | Course editor, lesson wizard, quiz designer, materials, offerings with capacity and minimum learners, live sessions with meeting links, mentor drafts with admin approval |
| Admin | Courses, mentors, users and roles, orders, reviews, promo codes, announcement banners |

Not in the module: a timed or standalone **mock exam**. Quizzes are per lesson (multiple choice,
pass percentage, graded on the server). A mock exam (question bank, random draw, timer, attempts,
result history) would be a new feature built on the same `Quiz` and `QuizDesigner` code.

## 2. Files to take

**Web (`apps/web/src`)**
- Pages: `app/[locale]/courses`, `cart`, `checkout`, `learn`, `my-courses`, `certificate`, `admin/*`, `mentor/*`
- Components: `CourseCard`, `CourseCover`, `BuyBox`, `CartView`, `CheckoutView`, `MyCourses`, `Player`, `Progress`, `Reviews`, `Stars`, `CertificateView`, `Signature`, `BannerSlider`
- Admin components: `components/admin/*` (CourseEditor, LessonWizard, QuizDesigner, MaterialsEditor, FileUpload, AdminCourses, AdminOrders, AdminPromos, AdminBanners, AdminMentors, AdminUsers, AdminReviews, AdminShell, AdminDashboard); mentor components: `components/mentor/*`
- Lib: `lib/api.ts` (the only place the web talks to the backend; mock or http mode), `admin-api.ts`, `mentor-api.ts`, `types.ts`, `store.tsx` (cart and session), `toast.tsx`, `validate.ts`, `video.ts`, `portals.ts`, `i18n.ts`, `dict/*`, `mock-data.ts`
- Brand tokens: `app/globals.css` (`@theme`). Swap these for the new site's brand.

**API (`services/api/src/main/java/sa/gba/academy`)**
- `catalog`, `orders` (`Pricing.java` holds the VAT split), `learning`, `promo`, `admin`, `mentor`, `files`, `auth`, `banner`, `common/CourseWriter.java`
- `integrations`: ports `PaymentGateway`, `EInvoiceService`, `VideoHosting`, `LiveVideo`, `FileStorage`, `MessagingService` with fake adapters and `GoogleMeetLiveVideo`

**Database (`services/api/src/main/resources/db/migration`)**
- `V1` to `V8`. Tables: `users`, `mentors`, `courses`, `offerings`, `live_sessions`, `orders`, `order_lines`, `enrollments`, `reviews`, `user_consents`, `media_files`, `promo_codes`, `promo_redemptions`, `banners`
- `V2` and `V8` are sample data. Regenerate `V2` with `node --experimental-strip-types scripts/generate-seed.mjs`. Do not edit applied migrations; add `V<n>`.

**Docs to copy with it:** `docs/api/README.md` (every endpoint, errors), `data-model.md`, `admin.md`, `integrations/payment.md`, `video.md`, `zatca.md`, `decisions/README.md` (D1 to D22), `flows/README.md`.

## 3. Rules the code relies on

- Money is an integer in halalas; displayed prices include 15% VAT.
- A course never holds a price or a date; offerings and sessions do.
- Roles `learner`, `mentor`, `admin` on one login. Every privileged call uses `Roles.require`. Mentor endpoints scope by the linked mentor profile and never return learner contact data.
- Course status: draft, pending, approved or rejected. Published implies approved. Mentors edit live courses only in content, quizzes, files and sessions.
- Public course JSON omits lesson `video` and `materials`. Enrolled learners get them from `GET /me/enrollments/{slug}/content`. Quiz answers never leave the server.
- UI text lives only in the dictionaries; domain content is `{ ar, en }` through `tr(value, locale)`.
- Payment, e-invoice, video, live video and messaging are ports. Do not call vendors from controllers.

## 4. What to change on the new website

1. Brand: tokens in `globals.css`, logo, fonts, legal text (`lib/dict/legal.ts`, `lib/placeholders.ts`).
2. Auth: either reuse this login or connect the new site's accounts; keep the three roles.
3. Real adapters: payment gateway, ZATCA e-invoicing, video hosting, Google Meet, email or SMS.
4. Domain wording and the kids area (`components/kids`, `lib/dict/kids.ts`) can be dropped if not needed.
5. If the new site is not Next.js and Spring Boot: the API contract (`docs/api/README.md`) and the schema are the portable parts.

## 5. Known limits

- The Java API has not been compiled in the authoring environment; run `mvn test` first.
- Real payment, ZATCA, video, Google Meet and messaging are not connected.
- Mock mode (browser storage) cannot show new content to learners on server-rendered public pages.
- Certificate verification endpoint and mentor payout rules are not built.
