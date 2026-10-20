"use client";
import Link from "next/link";
import { minPrice } from "@/lib/api";
import { moneyPlain, num, tr } from "@/lib/i18n";
import { mentorApi } from "@/lib/mentor-api";
import { useAdmin } from "../admin/AdminShell";
import { useLoad } from "../admin/hooks";
import { Badge, PageTitle, Table } from "../admin/ui";

const STATUS_TONE = { draft: "sand", pending: "gold", approved: "green", rejected: "red" } as const;

export function MentorCourses() {
  const { locale, a, token } = useAdmin();
  const { data } = useLoad(() => mentorApi.courses(token), [token]);
  return (
    <>
      <PageTitle actions={<Link href={`/${locale}/mentor/courses/new`} className="btn btn-gold">+ {a.mp.newCourse}</Link>}>{a.mp.nav.courses}</PageTitle>
      {!data ? <p className="text-mute">{a.common.loading}</p> : data.length === 0 ? <p className="card p-10 text-center text-mute">{a.common.empty}</p> : (
        <Table head={[a.courses.titleField, a.courses.audience, a.courses.offerings, a.common.status, ""]}>
          {data.map((c) => (
            <tr key={c.id} className="hover:bg-sand/40">
              <td className="px-4 py-3"><Link href={`/${locale}/mentor/courses/${c.id}`} className="font-bold text-navy hover:underline">{tr(c.title, locale)}</Link><div className="text-xs text-mute">{num(c.hours, locale)} {locale === "ar" ? "ساعة" : "h"}</div></td>
              <td className="px-4 py-3">{a.courses.audiences[c.audience]}</td>
              <td className="px-4 py-3">{c.offerings.map((o) => a.courses.modes[o.mode]).join(" · ")}<div className="text-xs text-mute">{moneyPlain(minPrice(c), locale)}</div></td>
              <td className="px-4 py-3"><Badge tone={STATUS_TONE[c.status ?? "approved"]}>{a.courses.status[c.status ?? "approved"]}</Badge>{c.status === "approved" && c.published === false && <div className="mt-1 text-xs text-mute">{a.courses.hidden}</div>}</td>
              <td className="px-4 py-3 text-end whitespace-nowrap">
                {c.status === "approved" && c.published !== false && <Link href={`/${locale}/courses/${c.slug}`} className="me-3 text-sm text-mute hover:underline">{a.mp.viewPublic}</Link>}
                <Link href={`/${locale}/mentor/courses/${c.id}`} className="text-sm font-bold text-navy hover:underline">{a.courses.edit}</Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
