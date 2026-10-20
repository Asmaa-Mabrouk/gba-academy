"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Avatar } from "../Avatar";
import { num, tr } from "@/lib/i18n";
import type { AdminMentor } from "@/lib/types";
import { Bi } from "./Bi";
import { useAdmin } from "./AdminShell";
import { errorText, useLoad } from "./hooks";
import { Badge, Field, PageTitle, Panel, Table } from "./ui";

const blank = (): AdminMentor => ({ id: "", slug: "", name: { ar: "", en: "" }, title: { ar: "", en: "" }, bio: { ar: "", en: "" }, expertise: [], languages: ["ar"], rating: 0, reviewCount: 0, courseCount: 0, learners: 0, hue: 40, userEmail: "" });

export function AdminMentors() {
  const { locale, a, token } = useAdmin();
  const t = a.mentors;
  const { data: list, reload } = useLoad(() => adminApi.mentors(token), [token]);
  const [edit, setEdit] = useState<AdminMentor | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const wantNew = useSearchParams().get("new");
  useEffect(() => { if (wantNew) { setEdit(blank()); setIsNew(true); } }, [wantNew]);

  const save = async () => {
    if (!edit) return;
    setMsg(null);
    try { await adminApi.saveMentor(token, edit, isNew); setEdit(null); reload(); }
    catch (e) { setMsg({ ok: false, text: errorText(a, e) }); }
  };

  if (edit)
    return (
      <>
        <PageTitle actions={<><button className="btn btn-outline" onClick={() => setEdit(null)}>{a.common.cancel}</button><button className="btn btn-gold" onClick={save}>{a.common.save}</button></>}>{isNew ? t.new : t.editTitle}</PageTitle>
        {msg && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{msg.text}</p>}
        <Panel>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label={t.slug}><input className="input" dir="ltr" disabled={!isNew} value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value.toLowerCase() })} /></Field>
              <Field label={t.expertise}><input className="input" dir="ltr" value={edit.expertise.join(", ")} onChange={(e) => setEdit({ ...edit, expertise: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
              <Field label={t.color}><input type="range" min={0} max={359} value={edit.hue} onChange={(e) => setEdit({ ...edit, hue: +e.target.value })} className="w-full accent-[#c49c3e]" /></Field>
            </div>
            <Bi a={a.common} label={t.name} value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <Bi a={a.common} label={t.jobTitle} value={edit.title} onChange={(v) => setEdit({ ...edit, title: v })} />
            <Bi a={a.common} label={t.bio} rows={4} value={edit.bio} onChange={(v) => setEdit({ ...edit, bio: v })} />
            <div className="flex gap-4 text-sm">
              <span className="font-bold text-navy">{t.languages}:</span>
              {(["ar", "en"] as const).map((l) => <label key={l} className="flex items-center gap-2"><input type="checkbox" className="accent-[#c49c3e]" checked={edit.languages.includes(l)} onChange={(e) => setEdit({ ...edit, languages: e.target.checked ? [...edit.languages, l] : edit.languages.filter((x) => x !== l) })} />{l === "ar" ? a.common.arabic : a.common.english}</label>)}
            </div>
            <Field label={t.account} hint={t.accountHint}><input className="input max-w-md" type="email" dir="ltr" value={edit.userEmail ?? ""} onChange={(e) => setEdit({ ...edit, userEmail: e.target.value })} /></Field>
          </div>
        </Panel>
      </>
    );

  return (
    <>
      <PageTitle actions={<button className="btn btn-gold" onClick={() => { setEdit(blank()); setIsNew(true); }}>+ {t.new}</button>}>{t.title}</PageTitle>
      {!list ? <p className="text-mute">{a.common.loading}</p> : (
        <Table head={[t.name, a.nav.courses, t.rating, t.account.split(" (")[0], ""]}>
          {list.map((m) => (
            <tr key={m.id} className="hover:bg-sand/40">
              <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={tr(m.name, locale)} hue={m.hue} size={40} /><div><b className="text-navy">{tr(m.name, locale)}</b><div className="text-xs text-mute">{tr(m.title, locale)}</div></div></div></td>
              <td className="px-4 py-3">{num(m.courseCount, locale)}</td>
              <td className="px-4 py-3">{num(m.rating, locale)} ({num(m.reviewCount, locale)})</td>
              <td className="px-4 py-3">{m.userEmail ? <Badge tone="green">{m.userEmail}</Badge> : <Badge>{t.notLinked}</Badge>}</td>
              <td className="px-4 py-3 text-end"><button className="text-sm font-bold text-navy hover:underline" onClick={() => { setEdit({ ...m, userEmail: m.userEmail ?? "" }); setIsNew(false); }}>{a.common.edit}</button></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
