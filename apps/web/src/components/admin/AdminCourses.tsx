"use client";
import Link from "next/link";
import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { minPrice } from "@/lib/api";
import { money, tr } from "@/lib/i18n";
import { useAdmin } from "./AdminShell";
import { errorText, useLoad, failErr } from "./hooks";
import { Badge, PageTitle, Table } from "./ui";

export function AdminCourses() {
  const { locale, a, token } = useAdmin();
  const { data: courses, reload } = useLoad(() => adminApi.courses(token), [token]);
  const { data: mentors } = useLoad(() => adminApi.mentors(token), [token]);
  const [q, setQ] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const pending = (courses ?? []).filter((c) => c.status === "pending").length;
  const [err, setErr] = useState("");
  const STATUS_TONE = { draft: "sand", pending: "gold", approved: "green", rejected: "red" } as const;
  const toggle = async (id: string, p: boolean) => { try { await adminApi.setPublished(token, id, p); reload(); } catch (e) { failErr(setErr, errorText(a, e)); } };
  const list = (courses ?? []).filter((c) => (!pendingOnly || c.status === "pending") && (!q || `${c.title.ar} ${c.title.en} ${c.slug}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <PageTitle actions={<Link href={`/${locale}/admin/courses/new`} className="btn btn-gold">+ {a.courses.new}</Link>}>{a.courses.title}</PageTitle>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className="input max-w-sm" placeholder={a.common.search} value={q} onChange={(e) => setQ(e.target.value)} />
        {pending > 0 && <button className={`chip ${pendingOnly ? "bg-gold text-navy" : "bg-gold/20 text-gold-deep"} font-bold`} onClick={() => setPendingOnly(!pendingOnly)}>{a.courses.status.pending}: {pending}</button>}
      </div>
      {err && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {!courses ? <p className="text-mute">{a.common.loading}</p> : (
        <Table head={[a.courses.titleField, a.courses.audience, a.courses.mentor, a.courses.offerings, a.common.status, ""]}>
          {list.map((c) => (
            <tr key={c.id} className="hover:bg-sand/40">
              <td className="px-4 py-3"><Link href={`/${locale}/admin/courses/${c.id}`} className="font-bold text-navy hover:underline">{tr(c.title, locale)}</Link><div className="text-xs text-mute" dir="ltr">{c.slug}</div></td>
              <td className="px-4 py-3">{a.courses.audiences[c.audience]}</td>
              <td className="px-4 py-3">{tr((mentors ?? []).find((m) => m.id === c.mentorId)?.name ?? { ar: "-", en: "-" }, locale)}</td>
              <td className="px-4 py-3">{c.offerings.map((o) => a.courses.modes[o.mode]).join(" · ")}<div className="text-xs text-mute">{money(minPrice(c), locale)}</div></td>
              <td className="px-4 py-3"><Badge tone={STATUS_TONE[c.status ?? "approved"]}>{a.courses.status[c.status ?? "approved"]}</Badge>{c.status === "approved" && c.published === false && <div className="mt-1 text-xs text-mute">{a.courses.hidden}</div>}</td>
              <td className="px-4 py-3 text-end whitespace-nowrap">
                {c.status === "approved" || !c.status ? <button className="me-3 text-sm font-bold text-gold-deep hover:underline" onClick={() => toggle(c.id, c.published === false)}>{c.published === false ? a.courses.publish : a.courses.unpublish}</button> : null}
                <Link href={`/${locale}/admin/courses/${c.id}`} className="text-sm font-bold text-navy hover:underline">{a.courses.edit}</Link>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
