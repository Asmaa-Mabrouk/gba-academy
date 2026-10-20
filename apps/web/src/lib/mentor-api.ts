// Mentor portal API. Everything is scoped to the mentor profile linked to the signed-in account.
//  - http: Java API under /mentor
//  - mock: works on the same browser copy of the sample data the admin mock edits (see admin-api.ts)
import { ApiError, http, idOf, isMock, K, read, seedUsers, write } from "./api";
import { getCourses, getMentors, getReviews, MK } from "./admin-api";
import type { AdminMentor, AdminReview, Bilingual, Course, Enrollment, MentorLearner, MentorSession, MentorStats } from "./types";

export interface MentorApi {
  me(t: string): Promise<AdminMentor>;
  saveMe(t: string, m: AdminMentor): Promise<AdminMentor>;
  stats(t: string): Promise<MentorStats>;
  courses(t: string): Promise<Course[]>;
  course(t: string, id: string): Promise<Course | null>;
  saveCourse(t: string, c: Course): Promise<Course>;
  createCourse(t: string, c: Course): Promise<Course>;
  submitCourse(t: string, id: string): Promise<Course>;
  withdrawCourse(t: string, id: string): Promise<Course>;
  sessions(t: string): Promise<MentorSession[]>;
  joinUrl(t: string, sessionId: string): Promise<string>;
  learners(t: string): Promise<MentorLearner[]>;
  reviews(t: string): Promise<AdminReview[]>;
  replyReview(t: string, id: string, reply: Bilingual | null): Promise<void>;
}

const httpMentor: MentorApi = {
  me: (t) => http("/mentor/me", { token: t }),
  saveMe: (t, m) => http("/mentor/me", { method: "PUT", token: t, body: JSON.stringify(m) }),
  stats: (t) => http("/mentor/stats", { token: t }),
  courses: (t) => http("/mentor/courses", { token: t }),
  course: (t, id) => http<Course>(`/mentor/courses/${id}`, { token: t }).catch(() => null),
  saveCourse: (t, c) => http(`/mentor/courses/${c.id}`, { method: "PUT", token: t, body: JSON.stringify(c) }),
  createCourse: (t, c) => http("/mentor/courses", { method: "POST", token: t, body: JSON.stringify(c) }),
  submitCourse: (t, id) => http(`/mentor/courses/${id}/submit`, { method: "POST", token: t }),
  withdrawCourse: (t, id) => http(`/mentor/courses/${id}/withdraw`, { method: "POST", token: t }),
  sessions: (t) => http("/mentor/sessions", { token: t }),
  joinUrl: async (t, id) => (await http<{ url: string }>(`/mentor/sessions/${id}/join`, { token: t })).url,
  learners: (t) => http("/mentor/learners", { token: t }),
  reviews: (t) => http("/mentor/reviews", { token: t }),
  replyReview: (t, id, r) => http(`/mentor/reviews/${id}/reply`, { method: "PUT", token: t, body: JSON.stringify(r ?? {}) }),
};

// ---------------- mock ----------------
function who(t: string): AdminMentor {
  const u = seedUsers().find((x) => x.id === idOf(t));
  if (!u?.roles.includes("mentor")) throw new ApiError("forbidden");
  const m = getMentors().find((x) => x.userEmail?.toLowerCase() === u.email.toLowerCase());
  if (!m) throw new ApiError("no_mentor_profile");
  return m;
}
const mine = (t: string) => { const m = who(t); return getCourses().filter((c) => c.mentorId === m.id); };
const titleOf = (slug: string): Bilingual => getCourses().find((c) => c.slug === slug)?.title ?? { ar: slug, en: slug };

/** Give every module, lesson, offering and session an id, as the server does. */
function fillIds(c: Course): Course {
  const id = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...c,
    modules: c.modules.map((m) => ({ ...m, id: m.id || id("m"), lessons: m.lessons.map((l) => ({ ...l, id: l.id || id("l") })) })),
    offerings: c.offerings.map((o) => ({ ...o, id: o.id || `${c.slug}-${o.mode}`, sessions: o.sessions.map((s) => ({ ...s, id: s.id || id("s"), seatsLeft: s.seatsLeft ?? s.seats })) })),
  };
}

const mockMentor: MentorApi = {
  async me(t) { return who(t); },
  async saveMe(t, m) {
    const cur = who(t);
    const next = { ...cur, name: m.name, title: m.title, bio: m.bio, expertise: m.expertise, languages: m.languages, hue: m.hue, imageUrl: m.imageUrl ?? null };
    write(MK.mentors, getMentors().map((x) => (x.id === cur.id ? next : x)));
    return next;
  },
  async stats(t) {
    const m = who(t); const cs = mine(t);
    const enr = Object.values(read<Record<string, Enrollment[]>>(K.enr, {})).flat();
    const orders = read<{ status: string; lines: { courseSlug: string; priceHalalas: number }[] }[]>(K.orders, []).filter((o) => o.status === "paid");
    const gross = (slug: string) => orders.flatMap((o) => o.lines).filter((l) => l.courseSlug === slug).reduce((s, l) => s + l.priceHalalas, 0);
    const byCourse = cs.map((c) => ({ slug: c.slug, title: c.title, learners: enr.filter((e) => e.courseSlug === c.slug).length, grossHalalas: gross(c.slug) }));
    return {
      courses: cs.length, learners: new Set(byCourse.length ? enr.filter((e) => cs.some((c) => c.slug === e.courseSlug)).map((e) => e.id) : []).size,
      rating: m.rating, reviewCount: m.reviewCount, grossHalalas: byCourse.reduce((s, c) => s + c.grossHalalas, 0), byCourse,
      upcomingSessions: cs.flatMap((c) => c.offerings.flatMap((o) => o.sessions)).filter((s) => +new Date(s.startsAt) > Date.now()).length,
    };
  },
  async courses(t) { return mine(t); },
  async course(t, id) { return mine(t).find((c) => c.id === id) ?? null; },
  async createCourse(t, c) {
    const m = who(t);
    if (getCourses().some((x) => x.slug === c.slug)) throw new ApiError("slug_exists");
    const full: Course = { ...fillIds(c), id: `c-${c.slug}`, mentorId: m.id, status: "draft", published: false, featured: false, isNew: false, bestseller: false, cpdPoints: null, rating: 0, reviewCount: 0, learners: 0 };
    write(MK.courses, [...getCourses(), full]);
    return full;
  },
  async saveCourse(t, c) {
    const cur = mine(t).find((x) => x.id === c.id);
    if (!cur) throw new ApiError("not_found");
    if (cur.status === "pending") throw new ApiError("pending_review");
    let next: Course;
    if (cur.status === "draft" || cur.status === "rejected") {
      // Still being prepared: everything is editable, including the proposed offerings and prices.
      next = { ...fillIds(c), id: cur.id, slug: cur.slug, mentorId: cur.mentorId, status: cur.status, published: false, featured: false, isNew: false, bestseller: false, cpdPoints: null, reviewNote: cur.reviewNote };
    } else {
      // Live: only content and sessions. Price, slug, audience, publishing and offerings are the admin's.
      next = {
        ...cur, title: c.title, subtitle: c.subtitle, description: c.description, outcomes: c.outcomes, hours: c.hours, languages: c.languages, ageRange: c.ageRange,
        materials: c.materials, quizzes: c.quizzes ?? cur.quizzes, modules: fillIds(c).modules,
        offerings: cur.offerings.map((o) => {
          const sent = c.offerings.find((x) => x.id === o.id);
          return o.mode === "recorded" || !sent ? o : { ...o, sessions: sent.sessions.map((s) => ({ ...s, id: s.id || `s-${Math.random().toString(36).slice(2, 8)}`, seatsLeft: s.seatsLeft ?? s.seats })) };
        }),
      };
    }
    write(MK.courses, getCourses().map((x) => (x.id === next.id ? next : x)));
    return next;
  },
  async submitCourse(t, id) {
    const cur = mine(t).find((x) => x.id === id);
    if (!cur) throw new ApiError("not_found");
    if (cur.status !== "draft" && cur.status !== "rejected") throw new ApiError("not_submittable");
    const lessons = cur.modules.flatMap((m) => m.lessons);
    if (!cur.title.ar && !cur.title.en) throw new ApiError("incomplete_course");
    if (lessons.length === 0 || cur.offerings.length === 0) throw new ApiError("incomplete_course");
    for (const l of lessons.filter((x) => x.kind === "quiz")) {
      const q = cur.quizzes?.[l.id];
      if (!q || q.questions.length === 0 || q.questions.some((x) => x.options.length < 2 || !x.correctId)) throw new ApiError("quiz_incomplete");
    }
    const next: Course = { ...cur, status: "pending", submittedAt: new Date().toISOString(), reviewNote: null };
    write(MK.courses, getCourses().map((x) => (x.id === id ? next : x)));
    return next;
  },
  async withdrawCourse(t, id) {
    const cur = mine(t).find((x) => x.id === id);
    if (!cur) throw new ApiError("not_found");
    if (cur.status !== "pending") throw new ApiError("not_pending");
    const next: Course = { ...cur, status: "draft" };
    write(MK.courses, getCourses().map((x) => (x.id === id ? next : x)));
    return next;
  },
  async sessions(t) {
    return mine(t).flatMap((c) => c.offerings.flatMap((o) => o.sessions.map((s) => ({ id: s.id, startsAt: s.startsAt, durationMin: s.durationMin, seats: s.seats, enrolled: s.seats - s.seatsLeft, title: s.title, courseSlug: c.slug, courseTitle: c.title, mode: o.mode, joinUrl: s.joinUrl ?? null, meetingProvider: s.meetingProvider ?? null }))))
      .filter((s) => +new Date(s.startsAt) > Date.now() - 864e5).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  },
  async joinUrl(_t, id) { return `about:blank#mock-room-${id}`; },
  async learners(t) {
    const slugs = new Set(mine(t).map((c) => c.slug));
    const users = seedUsers();
    const all = read<Record<string, Enrollment[]>>(K.enr, {});
    return Object.entries(all).flatMap(([uid, list]) => list.filter((e) => slugs.has(e.courseSlug)).map((e) => ({
      name: users.find((u) => u.id === uid)?.fullName ?? "-", courseSlug: e.courseSlug, courseTitle: titleOf(e.courseSlug), mode: e.mode,
      progressPct: e.progressPct, enrolledAt: e.enrolledAt, completed: !!e.certificateCode, guardian: users.find((u) => u.id === uid)?.registeringFor === "child",
    })));
  },
  async reviews(t) {
    const slugs = new Set(mine(t).map((c) => c.slug));
    return getReviews().filter((r) => slugs.has(r.courseSlug)).map((r) => ({ ...r, courseTitle: titleOf(r.courseSlug) })).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },
  async replyReview(t, id, reply) {
    const slugs = new Set(mine(t).map((c) => c.slug));
    write(MK.reviews, getReviews().map((r) => (r.id === id && slugs.has(r.courseSlug) ? { ...r, mentorReply: reply ?? undefined } : r)));
  },
};

export const mentorApi: MentorApi = isMock ? mockMentor : httpMentor;
