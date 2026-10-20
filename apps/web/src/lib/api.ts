// Single entry point to the backend. Pages never call fetch directly.
// NEXT_PUBLIC_API_MODE=mock  -> built-in sample data + localStorage (no backend needed)
// NEXT_PUBLIC_API_MODE=http  -> the Java API at NEXT_PUBLIC_API_URL (contract: docs/api/)
import { COURSES, DEMO_ACCOUNTS, MENTORS, REVIEWS } from "./mock-data";
import type {
  AuthResult, Course, CourseContent, CourseFilters, Enrollment, Mentor, Order, OrderLine, PaymentMethod, PromoCode, PromoQuote,
  Quiz, QuizResult, RegisterInput, Review, UploadedFile, UploadKind, User,
} from "./types";
import { VAT_RATE } from "./types";

const MODE = process.env.NEXT_PUBLIC_API_MODE ?? "mock";
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(public code: string, message?: string) { super(message ?? code); }
}

// ---------- public catalogue (works on server and in the browser) ----------
export interface CatalogApi {
  courses(f?: CourseFilters): Promise<Course[]>;
  course(slug: string): Promise<Course | null>;
  mentors(): Promise<Mentor[]>;
  mentor(slug: string): Promise<Mentor | null>;
  reviews(courseSlug: string): Promise<Review[]>;
}

export function minPrice(c: Course): number {
  return Math.min(...c.offerings.map((o) => o.priceHalalas));
}

function applyFilters(list: Course[], f: CourseFilters = {}): Course[] {
  let r = list.filter((c) => {
    if (f.audience && f.audience !== "all" && c.audience !== f.audience) return false;
    if (f.level && f.level !== "all" && c.level !== f.level) return false;
    if (f.topic && f.topic !== "all" && c.topic !== f.topic) return false;
    if (f.mode && f.mode !== "all" && !c.offerings.some((o) => o.mode === f.mode)) return false;
    if (f.freeOnly && minPrice(c) !== 0) return false;
    if (f.q) {
      const q = f.q.trim().toLowerCase();
      const hay = `${c.title.ar} ${c.title.en} ${c.subtitle.ar} ${c.subtitle.en}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  switch (f.sort) {
    case "rating": r = [...r].sort((a, b) => b.rating - a.rating); break;
    case "newest": r = [...r].sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
    case "priceAsc": r = [...r].sort((a, b) => minPrice(a) - minPrice(b)); break;
    case "priceDesc": r = [...r].sort((a, b) => minPrice(b) - minPrice(a)); break;
    default: r = [...r].sort((a, b) => b.learners - a.learners);
  }
  return r;
}

const mockCatalog: CatalogApi = {
  courses: async (f) => applyFilters(COURSES, f),
  course: async (slug) => COURSES.find((c) => c.slug === slug) ?? null,
  mentors: async () => MENTORS,
  mentor: async (slug) => MENTORS.find((m) => m.slug === slug) ?? null,
  reviews: async (slug) => REVIEWS.filter((r) => r.courseSlug === slug),
};

/** The API's address without the /api/v1 part, for links to uploaded files. */
export const apiOrigin = () => BASE.replace(/\/api\/v1\/?$/, "");

/**
 * Browser-ready address of a stored file. Uploaded files are served by the API (`/api/v1/files/<id>`); videos and documents
 * need the signed-in user, and a <video> or download link cannot send a header, so pass the token to add `?t=`.
 * Mock-mode files are data URLs and https links, which pass through unchanged.
 */
export function fileUrl(u: string | null | undefined, token?: string | null): string {
  if (!u) return "";
  if (!u.startsWith("/api/")) return u;
  const abs = apiOrigin() + u;
  return token ? `${abs}?t=${encodeURIComponent(token)}` : abs;
}

const MOCK_MAX: Record<UploadKind, number> = { image: 1.5e6, document: 2e6, video: 3e6 };
export const UPLOAD_MAX: Record<UploadKind, number> = { image: 5 * 1048576, document: 25 * 1048576, video: 500 * 1048576 };
export const UPLOAD_ACCEPT: Record<UploadKind, string> = {
  image: "image/png,image/jpeg,image/webp",
  document: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx",
  video: "video/mp4,video/webm",
};

/** Upload an image, a lesson video or a document. http: multipart POST /uploads. mock: kept in the browser as a small data URL. */
export async function uploadFile(token: string, file: File, kind: UploadKind, onProgress?: (pct: number) => void): Promise<UploadedFile> {
  if (file.size > UPLOAD_MAX[kind]) throw new ApiError("file_too_large");
  if (MODE !== "http") {
    if (file.size > MOCK_MAX[kind]) throw new ApiError("mock_file_too_big");
    const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new ApiError("error")); r.readAsDataURL(file); });
    onProgress?.(100);
    return { id: `mock-${Date.now()}`, url, name: file.name, size: file.size, kind, contentType: file.type };
  }
  // XMLHttpRequest, not fetch, so a large video can report its progress.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/uploads`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((100 * e.loaded) / e.total)); };
    xhr.onerror = () => reject(new ApiError("network"));
    xhr.onload = () => {
      let body: { code?: string } & Partial<UploadedFile> = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as UploadedFile);
      else reject(new ApiError(body.code ?? (xhr.status === 413 ? "file_too_large" : "error")));
    };
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    xhr.send(form);
  });
}

export async function http<T>(path: string, init?: RequestInit & { token?: string | null }): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers as object) } });
  if (!res.ok) {
    let code = "error";
    try { code = (await res.json()).code ?? code; } catch { /* ignore */ }
    throw new ApiError(code, `${res.status} ${path}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const httpCatalog: CatalogApi = {
  courses: (f = {}) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && v !== "all" && v !== "" && p.set(k, String(v)));
    return http(`/courses?${p}`);
  },
  course: (slug) => http<Course>(`/courses/${slug}`).catch(() => null),
  mentors: () => http("/mentors"),
  mentor: (slug) => http<Mentor>(`/mentors/${slug}`).catch(() => null),
  reviews: (slug) => http(`/courses/${slug}/reviews`),
};

export const catalog: CatalogApi = MODE === "http" ? httpCatalog : mockCatalog;

// ---------- signed-in learner features (browser only) ----------
export interface UserApi {
  register(input: RegisterInput): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  me(token: string): Promise<User | null>;
  checkout(token: string, lines: OrderLine[], method: PaymentMethod, promoCode?: string): Promise<Order>;
  validatePromo(token: string, code: string, offeringIds: string[], grossHalalas: number): Promise<PromoQuote>;
  enrollments(token: string): Promise<Enrollment[]>;
  completeLesson(token: string, courseSlug: string, lessonId: string): Promise<Enrollment>;
  quiz(token: string, courseSlug: string, lessonId: string): Promise<Quiz>;
  submitQuiz(token: string, courseSlug: string, lessonId: string, answers: Record<string, string>): Promise<QuizResult>;
  joinSession(token: string, sessionId: string): Promise<string>;
  content(token: string, courseSlug: string): Promise<CourseContent>;
  addReview(token: string, courseSlug: string, rating: number, comment: string, author: string): Promise<Review>;
  extraReviews(courseSlug: string): Promise<Review[]>;
}

// --- mock implementation: everything lives in localStorage ---
export const K = { users: "gba.users", enr: "gba.enrollments", orders: "gba.orders", reviews: "gba.reviews", promos: "gba.admin.promos", adminCourses: "gba.admin.courses" };
export function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
export function write(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ } }

export interface StoredUser extends User { password: string; consent?: { termsVersion: string; acceptedAt: string; marketing: boolean } }
export function seedUsers(): StoredUser[] {
  const u = read<StoredUser[]>(K.users, []);
  let changed = false;
  for (const d of DEMO_ACCOUNTS) {
    if (!u.find((x) => x.email === d.email)) {
      u.push({ id: `u-${d.key}`, fullName: d.fullName, email: d.email, locale: "ar", roles: d.roles, registeringFor: "self", password: d.password, createdAt: new Date().toISOString() } as StoredUser);
      changed = true;
    }
  }
  if (changed) write(K.users, u);
  return u;
}
const strip = ({ password: _p, ...u }: StoredUser): User => u;
const tokenFor = (id: string) => `mock.${id}`;
export const idOf = (t: string) => t.replace("mock.", "");

const total0 = (lines: OrderLine[]) => lines.reduce((s, l) => s + l.priceHalalas, 0);

/** Mock copy of the server's promo rules (PromoService.java): same error codes. */
type MockPromo = PromoCode & { usedBy?: string[] };
function mockQuote(raw: string, uid: string, gross: number): PromoQuote {
  const code = raw.trim().toUpperCase();
  const p = read<MockPromo[]>(K.promos, []).find((x) => x.code === code);
  if (!code || !p) throw new ApiError("promo_invalid");
  if (!p.active) throw new ApiError("promo_inactive");
  if (p.expiresAt && +new Date(p.expiresAt) < Date.now()) throw new ApiError("promo_expired");
  if (p.maxUses != null && p.usedCount >= p.maxUses) throw new ApiError("promo_exhausted");
  if (p.usedBy?.includes(uid)) throw new ApiError("promo_used");
  const discount = Math.min(gross, Math.round((gross * p.percentOff) / 100));
  return { code, percentOff: p.percentOff, grossHalalas: gross, discountHalalas: discount, totalHalalas: gross - discount };
}
const mockQuizOf = (slug: string, lessonId: string): Quiz | undefined => read<Course[]>(K.adminCourses, []).find((c) => c.slug === slug)?.quizzes?.[lessonId];

const mockUser: UserApi = {
  async register(i) {
    const users = seedUsers();
    if (users.some((u) => u.email.toLowerCase() === i.email.toLowerCase())) throw new ApiError("email_exists");
    if (i.password.length < 8 || !/[A-Za-z؀-ۿ]/.test(i.password) || !/\d/.test(i.password)) throw new ApiError("weak_password");
    const u: StoredUser = { id: `u-${Date.now()}`, fullName: i.fullName, email: i.email, mobile: i.mobile, locale: i.locale, roles: ["learner"], registeringFor: i.registeringFor, password: i.password, consent: { termsVersion: i.termsVersion, acceptedAt: new Date().toISOString(), marketing: i.marketingConsent } };
    write(K.users, [...users, u]);
    return { token: tokenFor(u.id), user: strip(u) };
  },
  async login(email, password) {
    const u = seedUsers().find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!u) throw new ApiError("invalid_credentials");
    return { token: tokenFor(u.id), user: strip(u) };
  },
  async me(token) {
    const u = seedUsers().find((x) => x.id === idOf(token));
    return u ? strip(u) : null;
  },
  async validatePromo(token, code, _ids, gross) { return mockQuote(code, idOf(token), gross); },
  async checkout(token, lines, method, promoCode) {
    const uid = idOf(token);
    const owned = read<Record<string, Enrollment[]>>(K.enr, {})[uid] ?? [];
    if (lines.some((l) => owned.some((e) => e.offeringId === l.offeringId))) throw new ApiError("already_enrolled");
    await new Promise((r) => setTimeout(r, total0(lines) === 0 ? 200 : 1400)); // fake gateway latency (none for free courses)
    const gross = lines.reduce((s, l) => s + l.priceHalalas, 0);
    const quote = promoCode?.trim() ? mockQuote(promoCode, uid, gross) : null;
    const total = quote ? quote.totalHalalas : gross;
    const net = Math.round(total / (1 + VAT_RATE));
    const n = read<unknown[]>(K.orders, []).length + 1;
    const order: Order = {
      id: `o-${Date.now()}`, number: `GBA-${new Date().getFullYear()}-${String(n).padStart(5, "0")}`, status: "paid",
      lines, subtotalHalalas: net, vatHalalas: total - net, totalHalalas: total, paymentMethod: method,
      createdAt: new Date().toISOString(), invoiceNumber: total === 0 ? undefined : `INV-${String(n).padStart(6, "0")}`,
      promoCode: quote?.code ?? null, discountHalalas: quote?.discountHalalas ?? 0,
    };
    if (quote) write(K.promos, read<MockPromo[]>(K.promos, []).map((p) => (p.code === quote.code ? { ...p, usedCount: p.usedCount + 1, usedBy: [...(p.usedBy ?? []), uid] } : p)));
    const buyer = seedUsers().find((x) => x.id === uid);
    write(K.orders, [...read<unknown[]>(K.orders, []), { ...order, userName: buyer?.fullName ?? "", userEmail: buyer?.email ?? "" }]);
    const all = read<Record<string, Enrollment[]>>(K.enr, {});
    const mine = all[uid] ?? [];
    for (const l of lines) {
      if (mine.some((e) => e.offeringId === l.offeringId)) continue;
      const c = COURSES.find((x) => x.slug === l.courseSlug);
      const o = c?.offerings.find((x) => x.id === l.offeringId);
      mine.push({
        id: `e-${l.offeringId}-${Date.now()}`, courseSlug: l.courseSlug, offeringId: l.offeringId, mode: l.mode,
        enrolledAt: new Date().toISOString(),
        expiresAt: o?.accessDays ? new Date(Date.now() + o.accessDays * 864e5).toISOString() : undefined,
        completedLessonIds: [], progressPct: 0,
        nextSession: o?.sessions.find((s) => new Date(s.startsAt) > new Date()),
      });
    }
    all[uid] = mine;
    write(K.enr, all);
    return order;
  },
  async enrollments(token) {
    return read<Record<string, Enrollment[]>>(K.enr, {})[idOf(token)] ?? [];
  },
  async completeLesson(token, courseSlug, lessonId) {
    const uid = idOf(token);
    const all = read<Record<string, Enrollment[]>>(K.enr, {});
    const e = (all[uid] ?? []).find((x) => x.courseSlug === courseSlug);
    if (!e) throw new ApiError("not_enrolled");
    if (mockQuizOf(courseSlug, lessonId)) throw new ApiError("quiz_required");
    const c = COURSES.find((x) => x.slug === courseSlug)!;
    const total = c.modules.reduce((s, m) => s + m.lessons.length, 0);
    if (!e.completedLessonIds.includes(lessonId)) e.completedLessonIds.push(lessonId);
    e.progressPct = Math.round((e.completedLessonIds.length / total) * 100);
    if (e.progressPct === 100 && !e.completedAt) e.completedAt = new Date().toISOString();
    if (e.progressPct === 100 && !e.certificateCode) e.certificateCode = `GBA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    write(K.enr, all);
    return e;
  },
  async quiz(token, slug, lessonId) {
    const enrolled = (read<Record<string, Enrollment[]>>(K.enr, {})[idOf(token)] ?? []).some((e) => e.courseSlug === slug);
    if (!enrolled) throw new ApiError("not_enrolled");
    const q = mockQuizOf(slug, lessonId);
    if (!q) throw new ApiError("not_found");
    return { passPct: q.passPct, questions: q.questions.map(({ id, prompt, options }) => ({ id, prompt, options })) };
  },
  async submitQuiz(token, slug, lessonId, answers) {
    const q = mockQuizOf(slug, lessonId);
    if (!q) throw new ApiError("not_found");
    const results = q.questions.map((x) => ({ id: x.id, correct: !!x.correctId && answers[x.id] === x.correctId, correctId: x.correctId ?? "", explanation: x.explanation }));
    const correct = results.filter((r) => r.correct).length;
    const scorePct = q.questions.length ? Math.round((100 * correct) / q.questions.length) : 0;
    const passed = q.questions.length > 0 && scorePct >= q.passPct;
    let enrollment: Enrollment | null = null;
    if (passed) {
      const uid = idOf(token);
      const all = read<Record<string, Enrollment[]>>(K.enr, {});
      const e = (all[uid] ?? []).find((x) => x.courseSlug === slug);
      if (e) {
        if (!e.completedLessonIds.includes(lessonId)) e.completedLessonIds.push(lessonId);
        const total = COURSES.find((c) => c.slug === slug)?.modules.reduce((n, m) => n + m.lessons.length, 0) ?? 1;
        e.progressPct = Math.min(100, Math.round((e.completedLessonIds.length / total) * 100));
        write(K.enr, all);
        enrollment = e;
      }
    }
    return { correct, total: q.questions.length, scorePct, passPct: q.passPct, passed, results, enrollment };
  },
  async content(token, slug) {
    const enrolled = (read<Record<string, Enrollment[]>>(K.enr, {})[idOf(token)] ?? []).some((e) => e.courseSlug === slug);
    if (!enrolled) throw new ApiError("not_enrolled");
    const c = read<Course[]>(K.adminCourses, []).find((x) => x.slug === slug) ?? COURSES.find((x) => x.slug === slug);
    if (!c) throw new ApiError("not_found");
    return { modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => ({ ...l, hasQuiz: !!c.quizzes?.[l.id] })) })), materials: c.materials ?? [] };
  },
  async joinSession(_t, sessionId) {
    const url = read<Course[]>(K.adminCourses, []).flatMap((c) => c.offerings.flatMap((o) => o.sessions)).find((x) => x.id === sessionId)?.joinUrl;
    if (!url) throw new ApiError("meeting_unavailable");
    return url;
  },
  async addReview(token, courseSlug, rating, comment, author) {
    const enrolled = (read<Record<string, Enrollment[]>>(K.enr, {})[idOf(token)] ?? []).some((e) => e.courseSlug === courseSlug);
    if (!enrolled) throw new ApiError("not_enrolled");
    const r: Review = { id: `r-${Date.now()}`, courseSlug, author, rating, comment: { ar: comment, en: comment }, createdAt: new Date().toISOString() };
    write(K.reviews, [...read<Review[]>(K.reviews, []), r]);
    return r;
  },
  async extraReviews(slug) { return read<Review[]>(K.reviews, []).filter((r) => r.courseSlug === slug); },
};

const httpUser: UserApi = {
  register: (i) => http("/auth/register", { method: "POST", body: JSON.stringify(i) }),
  login: (email, password) => http("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: (token) => http<User>("/me", { token }).catch(() => null),
  checkout: (token, lines, method, promoCode) => http("/orders", { method: "POST", token, body: JSON.stringify({ lines, paymentMethod: method, promoCode: promoCode?.trim() || undefined }) }),
  validatePromo: (token, code, offeringIds) => http("/promo/validate", { method: "POST", token, body: JSON.stringify({ code, offeringIds }) }),
  enrollments: (token) => http("/me/enrollments", { token }),
  completeLesson: (token, slug, lessonId) => http(`/me/enrollments/${slug}/lessons/${lessonId}/complete`, { method: "POST", token }),
  quiz: (token, slug, lessonId) => http(`/me/enrollments/${slug}/lessons/${lessonId}/quiz`, { token }),
  submitQuiz: (token, slug, lessonId, answers) => http(`/me/enrollments/${slug}/lessons/${lessonId}/quiz`, { method: "POST", token, body: JSON.stringify({ answers }) }),
  content: (token, slug) => http(`/me/enrollments/${slug}/content`, { token }),
  joinSession: async (token, id) => (await http<{ url: string }>(`/me/sessions/${id}/join`, { token })).url,
  addReview: (token, slug, rating, comment) => http(`/courses/${slug}/reviews`, { method: "POST", token, body: JSON.stringify({ rating, comment }) }),
  extraReviews: async () => [],
};

export const userApi: UserApi = MODE === "http" ? httpUser : mockUser;
export const isMock = MODE !== "http";
