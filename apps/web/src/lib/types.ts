// Shared domain types. They mirror the API contract in docs/api/openapi.md.
// Money is always an integer number of halalas (1 SAR = 100 halalas).

export type Locale = "ar" | "en";
export type Bilingual = { ar: string; en: string };

export type Audience = "kids" | "youth" | "experts";
export type Mode = "recorded" | "live" | "blended";
export type Role = "learner" | "mentor" | "admin";
export type Level = "beginner" | "intermediate" | "advanced";

export interface Mentor {
  id: string;
  slug: string;
  name: Bilingual;
  title: Bilingual;
  bio: Bilingual;
  expertise: string[];
  languages: Locale[];
  rating: number;
  reviewCount: number;
  courseCount: number;
  learners: number;
  hue: number; // used to colour the generated avatar
  imageUrl?: string | null; // uploaded photo; the coloured initials avatar is the fallback
}

export type LessonKind = "video" | "live" | "quiz" | "resource";

/** A downloadable file attached to a course or a lesson (PDF, slides, sheets). `url` is an uploaded file or an https link. */
export interface Material { id: string; name: string; url: string; size: number }
/** A lesson video is an uploaded file (`fileId`) or an external https link (`url`). */
export interface LessonVideo { fileId?: string; url?: string; name?: string }

export interface Lesson {
  id: string;
  title: Bilingual;
  minutes: number;
  kind: LessonKind;
  preview?: boolean;
  description?: Bilingual;
  video?: LessonVideo;
  materials?: Material[];
  hasQuiz?: boolean; // set by /me/enrollments/{slug}/content
}
/** What an enrolled learner may use: videos, files and which lessons have a quiz. */
export interface CourseContent { modules: CourseModule[]; materials: Material[] }

// ---- quizzes. Staff see the answers; learners get the questions without `correctId` / `explanation`. ----
export interface QuizOption { id: string; text: Bilingual }
export interface QuizQuestion { id: string; prompt: Bilingual; options: QuizOption[]; correctId?: string; explanation?: Bilingual }
export interface Quiz { passPct: number; questions: QuizQuestion[] }
export interface QuizResult {
  correct: number; total: number; scorePct: number; passPct: number; passed: boolean;
  results: { id: string; correct: boolean; correctId: string; explanation?: Bilingual }[];
  enrollment: Enrollment | null;
}

export interface CourseModule {
  id: string;
  title: Bilingual;
  lessons: Lesson[];
}

export interface LiveSession {
  id: string;
  startsAt: string; // ISO 8601, UTC
  durationMin: number;
  seats: number;
  seatsLeft: number;
  title: Bilingual;
  joinUrl?: string | null; // staff only: learners get the link from /me/sessions/{id}/join
  meetingProvider?: "google_meet" | "manual" | "fake" | null;
}

export interface Offering {
  id: string;
  mode: Mode;
  priceHalalas: number;
  compareAtHalalas?: number;
  accessDays?: number; // recorded access period
  cohortLabel?: Bilingual;
  capacity?: number | null;    // live and blended: maximum learners
  minLearners?: number | null; // live and blended: how many must book for the cohort to run
  enrolled?: number;           // learners booked so far
  sessions: LiveSession[];
}

/** Where a course is in the approval flow. Courses made by admins are approved at once; mentors submit theirs for review. */
export type CourseStatus = "draft" | "pending" | "approved" | "rejected";

export interface Course {
  id: string;
  slug: string;
  audience: Audience;
  level: Level;
  topic: string;
  title: Bilingual;
  subtitle: Bilingual;
  description: Bilingual;
  outcomes: Bilingual[];
  modules: CourseModule[];
  mentorId: string;
  rating: number;
  reviewCount: number;
  learners: number;
  hours: number;
  languages: Locale[];
  offerings: Offering[];
  featured: boolean;
  isNew: boolean;
  bestseller: boolean;
  ageRange?: string; // kids and youth tracks
  certificate: boolean;
  cpdPoints?: number | null;
  published?: boolean; // false = hidden from learners (admin only)
  materials?: Material[];             // course-level downloads
  status?: CourseStatus;              // staff only
  reviewNote?: string | null;         // staff only: why an admin sent it back
  submittedAt?: string | null;
  quizzes?: Record<string, Quiz>;     // staff only, keyed by lesson id
}

export interface Review {
  id: string;
  courseSlug: string;
  author: string;
  rating: number;
  comment: Bilingual;
  createdAt: string;
  mentorReply?: Bilingual;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  locale: Locale;
  roles: Role[];
  registeringFor: "self" | "child";
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  locale: Locale;
  registeringFor: "self" | "child";
  marketingConsent: boolean;
  acceptedTerms: boolean;
  termsVersion: string;
}

export type PaymentMethod = "mada" | "applepay" | "card";

export interface OrderLine {
  offeringId: string;
  courseSlug: string;
  mode: Mode;
  priceHalalas: number;
}

export interface Order {
  id: string;
  number: string;
  status: "pending" | "paid" | "failed" | "refunded";
  lines: OrderLine[];
  subtotalHalalas: number;
  vatHalalas: number;
  totalHalalas: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  invoiceNumber?: string;
  promoCode?: string | null;
  discountHalalas?: number;
}

export interface Enrollment {
  id: string;
  courseSlug: string;
  offeringId: string;
  mode: Mode;
  enrolledAt: string;
  expiresAt?: string;
  completedLessonIds: string[];
  progressPct: number;
  nextSession?: LiveSession;
  certificateCode?: string;
  completedAt?: string;
}

export interface CourseFilters {
  q?: string;
  audience?: Audience | "all";
  mode?: Mode | "all";
  level?: Level | "all";
  topic?: string;
  sort?: "popular" | "rating" | "newest" | "priceAsc" | "priceDesc";
  freeOnly?: boolean;
}

// VAT is included in every displayed price. 15% VAT means price = net * 1.15.
export const VAT_RATE = 0.15;

// ---- admin portal ----
export interface AdminStats {
  users: number; courses: number; publishedCourses: number; mentors: number; enrollments: number; orders: number;
  revenueHalalas: number; revenue30dHalalas: number; upcomingSessions: number; pendingCourses?: number;
  topCourses: { slug: string; title: Bilingual; learners: number }[];
}
export interface AdminMentor extends Mentor { userId?: string | null; userEmail?: string | null }
export interface AdminUser { id: string; fullName: string; email: string; mobile?: string; roles: Role[]; registeringFor: "self" | "child"; createdAt: string; enrollments: number }
export interface AdminOrder {
  id: string; number: string; status: Order["status"]; totalHalalas: number; vatHalalas: number; paymentMethod: PaymentMethod;
  invoiceNumber?: string; createdAt: string; userName: string; userEmail: string; promoCode?: string | null; discountHalalas?: number;
  lines: { courseSlug: string; courseTitle: Bilingual; mode: Mode; priceHalalas: number }[];
}
export interface AdminReview { id: string; courseSlug: string; courseTitle: Bilingual; author: string; rating: number; comment: Bilingual; mentorReply?: Bilingual | null; createdAt: string }

// ---- mentor portal ----
export interface MentorStats {
  courses: number; learners: number; rating: number; reviewCount: number; upcomingSessions: number; grossHalalas: number;
  byCourse: { slug: string; title: Bilingual; learners: number; grossHalalas: number }[];
}
export interface MentorLearner { name: string; courseSlug: string; courseTitle: Bilingual; mode: Mode; progressPct: number; enrolledAt: string; completed: boolean; guardian: boolean }
export interface MentorSession { id: string; startsAt: string; durationMin: number; seats: number; enrolled: number; title: Bilingual; courseSlug: string; courseTitle: Bilingual; mode: Mode; joinUrl?: string | null; meetingProvider?: LiveSession["meetingProvider"] }

// ---- promo codes ----
export interface PromoCode { id: string; code: string; percentOff: number; maxUses: number | null; usedCount: number; expiresAt: string | null; active: boolean; expired?: boolean; note?: string | null; createdAt: string }
export interface PromoQuote { code: string; percentOff: number; grossHalalas: number; discountHalalas: number; totalHalalas: number }

// ---- uploads ----
export type UploadKind = "image" | "video" | "document";
export interface UploadedFile { id: string; url: string; name: string; size: number; kind: UploadKind; contentType: string }
