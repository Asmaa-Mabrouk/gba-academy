// Admin back-office API. Same two modes as api.ts:
//  - http: the Java API under /admin (needs a signed-in user with the "admin" role)
//  - mock: edits a copy of the sample data in this browser's localStorage. Mock edits do NOT change the public
//    pages, which are rendered on the server from the built-in sample data. Use http mode for a real admin.
import { COURSES, MENTORS, REVIEWS } from "./mock-data";
import { http, idOf, isMock, K, read, seedUsers, write, ApiError } from "./api";
import type { AdminMentor, AdminOrder, AdminReview, AdminStats, AdminUser, Bilingual, Course, Mentor, Review, Role } from "./types";

export interface AdminApi {
  stats(t: string): Promise<AdminStats>;
  courses(t: string): Promise<Course[]>;
  course(t: string, id: string): Promise<Course | null>;
  saveCourse(t: string, course: Course, isNew: boolean): Promise<Course>;
  setPublished(t: string, id: string, published: boolean): Promise<void>;
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
export const MK = { courses: "gba.admin.courses", mentors: "gba.admin.mentors", reviews: "gba.admin.reviews" };
export const getCourses = () => read<Course[]>(MK.courses, COURSES.map((c) => ({ ...c, published: true })));
export const getMentors = () => read<AdminMentor[]>(MK.mentors, MENTORS.map((m) => ({ ...m, userId: null, userEmail: m.id === "m1" ? "mentor@demo.sa" : null })));
export const getReviews = () => read<Review[]>(MK.reviews, REVIEWS);
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
      users: seedUsers().length, courses: courses.length, publishedCourses: courses.filter((c) => c.published !== false).length,
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
      ...c, id: isNew ? `c-${c.slug}` : c.id,
      modules: c.modules.map((m) => ({ ...m, id: m.id || uid("m"), lessons: m.lessons.map((l) => ({ ...l, id: l.id || uid("l") })) })),
      offerings: c.offerings.map((o) => ({ ...o, id: o.id || `${c.slug}-${o.mode}`, sessions: o.sessions.map((s) => ({ ...s, id: s.id || uid("s"), seatsLeft: s.seatsLeft ?? s.seats })) })),
    };
    write(MK.courses, isNew ? [...list, full] : list.map((x) => (x.id === full.id ? full : x)));
    return full;
  },
  async setPublished(t, id, p) { guard(t); write(MK.courses, getCourses().map((c) => (c.id === id ? { ...c, published: p } : c))); },
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
  async deleteReview(t, id) { guard(t); write(MK.reviews, getReviews().filter((r) => r.id !== id)); },
  async replyReview(t, id, reply) { guard(t); write(MK.reviews, getReviews().map((r) => (r.id === id ? { ...r, mentorReply: reply ?? undefined } : r))); },
};

export const adminApi: AdminApi = isMock ? mockAdmin : httpAdmin;
export type { Mentor };
