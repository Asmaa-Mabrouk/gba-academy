"use client";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { moneyPlain as money, num, tr } from "@/lib/i18n";
import { useAdmin } from "./AdminShell";
import { useLoad } from "./hooks";
import { PageTitle, Panel } from "./ui";

export function AdminDashboard() {
  const { locale, a, token } = useAdmin();
  const { data: s } = useLoad(() => adminApi.stats(token), [token]);
  if (!s) return <p className="text-mute">{a.common.loading}</p>;
  const d = a.dashboard;
  const cards: [string, string, string?][] = [
    [d.revenue, money(s.revenueHalalas, locale)], [d.revenue30, money(s.revenue30dHalalas, locale)], [d.orders, num(s.orders, locale)],
    [d.enrollments, num(s.enrollments, locale)], [d.users, num(s.users, locale)], [d.courses, num(s.courses, locale), `${num(s.publishedCourses, locale)} ${d.published}`],
    [d.mentors, num(s.mentors, locale)], [d.sessions, num(s.upcomingSessions, locale)],
  ];
  return (
    <>
      <PageTitle>{a.nav.dashboard}</PageTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([l, v, sub]) => (
          <div key={l} className="card p-5"><p className="text-sm text-mute">{l}</p><p className="mt-1 text-2xl font-black text-navy">{v}</p>{sub && <p className="text-xs text-mute">{sub}</p>}</div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title={d.top}>
          <ol className="space-y-3">
            {s.topCourses.map((c, i) => (
              <li key={c.slug} className="flex items-center gap-3"><span className="gold-bg flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-navy">{num(i + 1, locale)}</span><span className="flex-1 truncate">{tr(c.title, locale)}</span><b>{num(c.learners, locale)}</b></li>
            ))}
          </ol>
        </Panel>
        <Panel title={d.quick}>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}/admin/courses/new`} className="btn btn-gold">{d.newCourse}</Link>
            <Link href={`/${locale}/admin/mentors?new=1`} className="btn btn-outline">{d.newMentor}</Link>
            <Link href={`/${locale}/admin/orders`} className="btn btn-outline">{a.nav.orders}</Link>
          </div>
        </Panel>
      </div>
    </>
  );
}
