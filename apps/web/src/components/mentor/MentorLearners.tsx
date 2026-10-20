"use client";
import { dateOnly, num, tr } from "@/lib/i18n";
import { mentorApi } from "@/lib/mentor-api";
import { useAdmin } from "../admin/AdminShell";
import { useLoad } from "../admin/hooks";
import { Badge, PageTitle, Table } from "../admin/ui";

export function MentorLearners() {
  const { locale, a, token } = useAdmin();
  const { data } = useLoad(() => mentorApi.learners(token), [token]);
  const t = a.mp.learners;
  return (
    <>
      <PageTitle>{a.mp.nav.learners}</PageTitle>
      <p className="mb-4 text-sm text-mute">{t.note}</p>
      {!data ? <p className="text-mute">{a.common.loading}</p> : data.length === 0 ? <p className="card p-10 text-center text-mute">{a.common.empty}</p> : (
        <Table head={[a.users.name, t.course, a.courses.mode, t.progress, a.common.date]}>
          {data.map((l, i) => (
            <tr key={i}>
              <td className="px-4 py-3 font-bold text-navy">{l.name}{l.guardian && <span className="ms-2"><Badge tone="gold">{t.guardian}</Badge></span>}</td>
              <td className="px-4 py-3">{tr(l.courseTitle, locale)}</td>
              <td className="px-4 py-3">{a.courses.modes[l.mode]}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-sand"><div className="gold-bg h-full" style={{ width: `${l.progressPct}%` }} /></div>{num(l.progressPct, locale)}%{l.completed && <Badge tone="green">{t.done}</Badge>}</div></td>
              <td className="px-4 py-3 text-mute">{dateOnly(l.enrolledAt, locale)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
