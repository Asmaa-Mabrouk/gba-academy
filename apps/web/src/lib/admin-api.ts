// Admin back-office API. Same two modes as api.ts:
//  - http: the Java API under /admin (needs a signed-in user with the "admin" role)
//  - mock: edits a copy of the sample data in this browser's localStorage. Mock edits do NOT change the public
//    pages, which are rendered on the server from the built-in sample data. Use http mode for a real admin.
import { COURSES, MENTORS, REVIEWS } from "./mock-data";
import { http, idOf, isMock, K, read, seedUsers, write, ApiError } from "./api";
import type { AdminMentor, AdminOrder, AdminReview, AdminStats, AdminUser, Bilingual, Course, Mentor, PromoCode, Review, Role } from "./types";

export interface AdminApi {
  stats(t: string): Promise<AdminStats>;
  courses(t: string): Promise<Course[]>;
  course(t: string, id: string): Promise<Course | null>;
  saveCourse(t: string, course: Course, isNew: boolean): Promise<Course>;
  setPublished(t: string, id: string, published: boolean): Promise<void>;
  approveCourse(t: string, id: string, publish: boolean): Promise<Course>;
  rejectCourse(t: string, id: string, note: string): Promise<Course>;
  ensureMeeting(t: string, sessionId: string): Promise<string>;
  promos(t: string): Promise<PromoCode[]>;
  savePromo(t: string, p: Partial<PromoCode> & { code?: string }, isNew: boolean): Promise<PromoCode>;
  deletePromo(t: string, id: string): Promise<void>;
  mentors(t: string): Promise<AdminMentor[]>;
  saveMentor(t: string, m: AdminMentor, isNew: boolean): Promise<AdminMentor>;
  users(t: string): Promise<AdminUser[]>;
  setRoles(t: string, userId: string, roles: Role[]): Promise<void>;
  orders(t: string): Promise<AdminOrder[]>;
  reviews(t: string): Promise<AdminReview[]>;
  deleteReview(t: string, id: string): Promise<void>;
  replyReview(t: string, id: string, reply: Bilingual | null): Promise<void>;
}

const httpAdmin: AdminApi = {
  stats: (t) => http("/admin/stats", { token: t }),
  courses: (t) => http("/admin/courses", { token: t }),
  course: (t, id) => http<Course>(`/admin/courses/${id}`, { token: t }).catch(() => null),
  saveCourse: (t, c, isNew) => http(isNew ? "/admin/courses" : `/admin/courses/${c.id}`, { method: isNew ? "POST" : "PUT", token: t, body: JSON.stringify(c) }),
  setPublished: (t, id, p) => http(`/admin/courses/${id}/published`, { method: "PUT", token: t, body: JSON.stringify({ published: p }) }),
  approveCourse: (t, id, publish) => http(`/admin/courses/${id}/approve`, { method: "POST", token: t, body: JSON.stringify({ publish }) }),
  rejectCourse: (t, id, note) => http(`/admin/courses/${id}/reject`, { method: "POST", token: t, body: JSON.stringify({ note }) }),
  ensureMeeting: async (t, id) => (await http<{ url: string }>(`/admin/sessions/${id}/meeting`, { method: "POST", token: t })).url,
  promos: (t) => http("/admin/promos", { token: t }),
  savePromo: (t, p, isNew) => http(isNew ? "/admin/promos" : `/admin/promos/${p.id}`, { method: isNew ? "POST" : "PUT", token: t, body: JSON.stringify(p) }),
  deletePromo: (t, id) => http(`/admin/promos/${id}`, { method: "DELETE", token: t }),
  mentors: (t) => http("/admin/mentors", { token: t }),
  saveMentor: (t, m, isNew) => http(isNew ? "/admin/mentors" : `/admin/mentors/${m.id}`, { method: isNew ? "POST" : "PUT", token: t, body: JSON.stringify(m) }),
  users: (t) => http("/admin/users", { token: t }),
  setRoles: (t, id, roles) => http(`/admin/users/${id}/roles`, { method: "PUT", token: t, body: JSON.stringify({ roles }) }),
  orders: (t) => http("/admin/orders", { token: t }),
  reviews: (t) => http("/admin/reviews", { token: t }),
  deleteReview: (t, id) => http(`/admin/reviews/${id}`, { method: "DELETE", token: t }),
  replyReview: (t, id, r) => http(`/admin/reviews/${id}/reply`, { method: "PUT", token: t, body: JSON.stringify(r ?? {}) }),
};

// ---------------- mock ----------------
export const MK = { courses: K.adminCourses, mentors: "gba.admin.mentors", reviews: "gba.admin.reviews", promos: K.promos };
export const getCourses = () => read<Course[]>(MK.courses, COURSES.map((c) => ({ ...c, published: true, status: "approved" as const })));
export const getMentors = () => read<AdminMentor[]>(MK.mentors, MENTORS.map((m) => ({ ...m, userId: null, userEmail: m.id === "m1" ? "mentor@demo.sa" : null })));
/** Admin store plus reviews learners posted in mock mode (stored under K.reviews). */
export const getReviews = () => {
  const own = read<Review[]>(MK.reviews, REVIEWS);
  const ids = new Set(own.map((r) => r.id));
  return [...own, ...read<Review[]>(K.reviews, []).filter((r) => !ids.has(r.id))];
};
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const guard = (t: string) => {
  const u = seedUsers().find((x) => x.id === idOf(t));
  if (!u?.roles.includes("admin")) throw new ApiError("forbidden");
};

const mockAdmin: AdminApi = {
  async stats(t) {
    guard(t);
    const courses = getCourses();
    const orders = read<AdminOrder[]>(K.orders, []).filter((o) => o.status === "paid");
    return {
      users: seedUsers().length, courses: courses.length, publishedCourses: courses.filter((c) => c.published !== false).length, pendingCourses: courses.filter((c) => c.status === "pending").length,
      mentors: getMentors().length, enrollments: Object.values(read<Record<string, unknown[]>>(K.enr, {})).reduce((s, l) => s + l.length, 0),
      orders: orders.length, revenueHalalas: orders.reduce((s, o) => s + o.totalHalalas, 0),
      revenue30dHalalas: orders.filter((o) => Date.now() - +new Date(o.createdAt) < 30 * 864e5).reduce((s, o) => s + o.totalHalalas, 0),
      upcomingSessions: courses.flatMap((c) => c.offerings.flatMap((o) => o.sessions)).filter((s) => +new Date(s.startsAt) > Date.now()).length,
      topCourses: [...courses].sort((a, b) => b.learners - a.learners).slice(0, 5).map((c) => ({ slug: c.slug, title: c.title, learners: c.learners })),
    };
  },
  async courses(t) { guard(t); return getCourses(); },
  async course(t, id) { guard(t); return getCourses().find((c) => c.id === id) ?? null; },
  async saveCourse(t, c, isNew) {
    guard(t);
    const list = getCourses();
    if (isNew && list.some((x) => x.slug === c.slug)) throw new ApiError("slug_exists");
    const full: Course = {
      ...c, id: isNew ? `c-${c.slug}` : c.id, status: isNew ? "approved" : (list.find((x) => x.id === c.id)?.status ?? "approved"),
      modules: c.modules.map((m) => ({ ...m, id: m.id || uid("m"), lessons: m.lessons.map((l) => ({ ...l, id: l.id || uid("l") })) })),
      offerings: c.offerings.map((o) => ({ ...o, id: o.id || `${c.slug}-${o.mode}`, sessions: o.sessions.map((s) => ({ ...s, id: s.id || uid("s"), seatsLeft: s.seatsLeft ?? s.seats })) })),
    };
    write(MK.courses, isNew ? [...list, full] : list.map((x) => (x.id === full.id ? full : x)));
    return full;
  },
  async setPublished(t, id, p) {
    guard(t);
    if (p && (getCourses().find((c) => c.id === id)?.status ?? "approved") !== "approved") throw new ApiError("not_approved");
    write(MK.courses, getCourses().map((c) => (c.id === id ? { ...c, published: p } : c)));
  },
  async approveCourse(t, id, publish) {
    guard(t);
    const cur = getCourses().find((c) => c.id === id);
    if (!cur) throw new ApiError("not_found");
    if (cur.status !== "pending") throw new ApiError("not_pending");
    const next: Course = { ...cur, status: "approved", published: publish, reviewNote: null };
    write(MK.courses, getCourses().map((c) => (c.id === id ? next : c)));
    return next;
  },
  async rejectCourse(t, id, note) {
    guard(t);
    const cur = getCourses().find((c) => c.id === id);
    if (!cur) throw new ApiError("not_found");
    if (cur.status !== "pending") throw new ApiError("not_pending");
    if (!note.trim()) throw new ApiError("missing_note");
    const next: Course = { ...cur, status: "rejected", published: false, reviewNote: note.trim() };
    write(MK.courses, getCourses().map((c) => (c.id === id ? next : c)));
    return next;
  },
  async ensureMeeting(t, sessionId) {
    guard(t);
    const url = `about:blank#mock-room-${sessionId}`;
    write(MK.courses, getCourses().map((c) => ({ ...c, offerings: c.offerings.map((o) => ({ ...o, sessions: o.sessions.map((s) => (s.id === sessionId && !s.joinUrl ? { ...s, joinUrl: url, meetingProvider: "fake" as const } : s)) })) })));
    return url;
  },
  async promos(t) { guard(t); return read<PromoCode[]>(MK.promos, []).map((p) => ({ ...p, expired: !!p.expiresAt && +new Date(p.expiresAt) < Date.now() })); },
  async savePromo(t, p, isNew) {
    guard(t);
    const list = read<PromoCode[]>(MK.promos, []);
    const code = (p.code ?? "").trim().toUpperCase();
    if (isNew) {
      if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new ApiError("invalid_code");
      if (list.some((x) => x.code === code)) throw new ApiError("code_exists");
    }
    if (!p.percentOff || p.percentOff < 1 || p.percentOff > 100) throw new ApiError("invalid_percent");
    const cur = list.find((x) => x.id === p.id);
    if (p.maxUses != null && p.maxUses < (cur?.usedCount ?? 0)) throw new ApiError("max_uses_below_used");
    const full: PromoCode = { id: isNew ? uid("p") : p.id!, code: isNew ? code : cur!.code, percentOff: p.percentOff, maxUses: p.maxUses ?? null, usedCount: cur?.usedCount ?? 0, expiresAt: p.expiresAt ?? null, active: p.active ?? true, note: p.note ?? null, createdAt: cur?.createdAt ?? new Date().toISOString() };
    write(MK.promos, isNew ? [full, ...list] : list.map((x) => (x.id === full.id ? { ...x, ...full } : x)));
    return full;
  },
  async deletePromo(t, id) {
    guard(t);
    const p = read<PromoCode[]>(MK.promos, []).find((x) => x.id === id);
    if (p && p.usedCount > 0) throw new ApiError("promo_in_use");
    write(MK.promos, read<PromoCode[]>(MK.promos, []).filter((x) => x.id !== id));
  },
  async mentors(t) { guard(t); return getMentors(); },
  async saveMentor(t, m, isNew) {
    guard(t);
    const list = getMentors();
    if (isNew && list.some((x) => x.slug === m.slug)) throw new ApiError("slug_exists");
    const full = { ...m, id: isNew ? `m-${m.slug}` : m.id };
    write(MK.mentors, isNew ? [...list, full] : list.map((x) => (x.id === full.id ? full : x)));
    return full;
  },
  async users(t) {
    guard(t);
    const enr = read<Record<string, unknown[]>>(K.enr, {});
    return seedUsers().map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, mobile: u.mobile, roles: u.roles, registeringFor: u.registeringFor, createdAt: (u as unknown as { createdAt?: string }).createdAt ?? new Date().toISOString(), enrollments: (enr[u.id] ?? []).length }));
  },
  async setRoles(t, id, roles) {
    guard(t);
    const me = idOf(t);
    const next = Array.from(new Set<Role>(["learner", ...roles]));
    if (me === id && !next.includes("admin")) throw new ApiError("cannot_remove_own_admin");
    write(K.users, seedUsers().map((u) => (u.id === id ? { ...u, roles: next } : u)));
  },
  async orders(t) { guard(t); return read<AdminOrder[]>(K.orders, []).map((o) => ({ ...o, lines: (o.lines as unknown as { courseSlug: string; mode: AdminOrder["lines"][0]["mode"]; priceHalalas: number }[]).map((l) => ({ ...l, courseTitle: COURSES.find((c) => c.slug === l.courseSlug)?.title ?? { ar: l.courseSlug, en: l.courseSlug } })) })).reverse(); },
  async reviews(t) {
    guard(t);
    const courses = getCourses();
    return getReviews().map((r) => ({ ...r, courseTitle: courses.find((c) => c.slug === r.courseSlug)?.title ?? { ar: r.courseSlug, en: r.courseSlug } })).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },
  async deleteReview(t, id) { guard(t); write(MK.reviews, getReviews().filter((r) => r.id !== id)); write(K.reviews, read<Review[]>(K.reviews, []).filter((r) => r.id !== id)); },
  async replyReview(t, id, reply) { guard(t); write(MK.reviews, getReviews().map((r) => (r.id === id ? { ...r, mentorReply: reply ?? undefined } : r))); },
};

export const adminApi: AdminApi = isMock ? mockAdmin : httpAdmin;
export type { Mentor };
