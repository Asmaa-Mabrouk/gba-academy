"use client";
import Link from "next/link";
import { moneyPlain, num, tr } from "@/lib/i18n";
import { mentorApi } from "@/lib/mentor-api";
import { Stars } from "../Stars";
import { useAdmin } from "../admin/AdminShell";
import { useLoad } from "../admin/hooks";
import { PageTitle, Panel, Table } from "../admin/ui";

export function MentorDashboard() {
  const { locale, a, token } = useAdmin();
  const { data: s } = useLoad(() => mentorApi.stats(token), [token]);
  const t = a.mp.stats;
  if (!s) return <p className="text-mute">{a.common.loading}</p>;
  return (
    <>
      <PageTitle>{a.mp.nav.overview}</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-mute">{t.learners}</p><p className="mt-1 text-2xl font-black text-navy">{num(s.learners, locale)}</p></div>
        <div className="card p-5"><p className="text-sm text-mute">{t.courses}</p><p className="mt-1 text-2xl font-black text-navy">{num(s.courses, locale)}</p></div>
        <div className="card p-5"><p className="text-sm text-mute">{t.rating}</p><p className="mt-1 flex items-center gap-2 text-2xl font-black text-navy">{num(s.rating, locale)} <Stars value={s.rating} size={16} /></p><p className="text-xs text-mute">({num(s.reviewCount, locale)})</p></div>
        <div className="card p-5"><p className="text-sm text-mute">{t.upcoming}</p><p className="mt-1 text-2xl font-black text-navy">{num(s.upcomingSessions, locale)}</p></div>
      </div>
      <Panel title={t.gross} className="mt-6">
        <p className="text-3xl font-black text-navy">{moneyPlain(s.grossHalalas, locale)}</p>
        <p className="mb-4 text-xs text-mute">{t.grossNote}</p>
        <Table head={[a.nav.courses, t.learners, t.gross]}>
          {s.byCourse.map((c) => (
            <tr key={c.slug}><td className="px-4 py-3"><Link className="font-bold text-navy hover:underline" href={`/${locale}/courses/${c.slug}`}>{tr(c.title, locale)}</Link></td><td className="px-4 py-3">{num(c.learners, locale)}</td><td className="px-4 py-3">{moneyPlain(c.grossHalalas, locale)}</td></tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
