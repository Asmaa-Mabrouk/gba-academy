// Single entry point to the backend. Pages never call fetch directly.
// NEXT_PUBLIC_API_MODE=mock  -> built-in sample data + localStorage (no backend needed)
// NEXT_PUBLIC_API_MODE=http  -> the Java API at NEXT_PUBLIC_API_URL (contract: docs/api/)
import { COURSES, DEMO_ACCOUNTS, MENTORS, REVIEWS } from "./mock-data";
import type {
  AuthResult, Course, CourseFilters, Enrollment, Mentor, Order, OrderLine, PaymentMethod,
  RegisterInput, Review, User,
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
  checkout(token: string, lines: OrderLine[], method: PaymentMethod): Promise<Order>;
  enrollments(token: string): Promise<Enrollment[]>;
  completeLesson(token: string, courseSlug: string, lessonId: string): Promise<Enrollment>;
  addReview(token: string, courseSlug: string, rating: number, comment: string, author: string): Promise<Review>;
  extraReviews(courseSlug: string): Promise<Review[]>;
}

// --- mock implementation: everything lives in localStorage ---
export const K = { users: "gba.users", enr: "gba.enrollments", orders: "gba.orders", reviews: "gba.reviews" };
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
  async checkout(token, lines, method) {
    const uid = idOf(token);
    const owned = read<Record<string, Enrollment[]>>(K.enr, {})[uid] ?? [];
    if (lines.some((l) => owned.some((e) => e.offeringId === l.offeringId))) throw new ApiError("already_enrolled");
    await new Promise((r) => setTimeout(r, total0(lines) === 0 ? 200 : 1400)); // fake gateway latency (none for free courses)
    const total = lines.reduce((s, l) => s + l.priceHalalas, 0);
    const net = Math.round(total / (1 + VAT_RATE));
    const n = read<unknown[]>(K.orders, []).length + 1;
    const order: Order = {
      id: `o-${Date.now()}`, number: `GBA-${new Date().getFullYear()}-${String(n).padStart(5, "0")}`, status: "paid",
      lines, subtotalHalalas: net, vatHalalas: total - net, totalHalalas: total, paymentMethod: method,
      createdAt: new Date().toISOString(), invoiceNumber: total === 0 ? undefined : `INV-${String(n).padStart(6, "0")}`,
    };
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
    const c = COURSES.find((x) => x.slug === courseSlug)!;
    const total = c.modules.reduce((s, m) => s + m.lessons.length, 0);
    if (!e.completedLessonIds.includes(lessonId)) e.completedLessonIds.push(lessonId);
    e.progressPct = Math.round((e.completedLessonIds.length / total) * 100);
    if (e.progressPct === 100 && !e.completedAt) e.completedAt = new Date().toISOString();
    if (e.progressPct === 100 && !e.certificateCode) e.certificateCode = `GBA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    write(K.enr, all);
    return e;
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
  checkout: (token, lines, method) => http("/orders", { method: "POST", token, body: JSON.stringify({ lines, paymentMethod: method }) }),
  enrollments: (token) => http("/me/enrollments", { token }),
  completeLesson: (token, slug, lessonId) => http(`/me/enrollments/${slug}/lessons/${lessonId}/complete`, { method: "POST", token }),
  addReview: (token, slug, rating, comment) => http(`/courses/${slug}/reviews`, { method: "POST", token, body: JSON.stringify({ rating, comment }) }),
  extraReviews: async () => [],
};

export const userApi: UserApi = MODE === "http" ? httpUser : mockUser;
export const isMock = MODE !== "http";
