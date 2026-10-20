"use client";
import { useEffect, useState } from "react";
import { mentorApi } from "@/lib/mentor-api";
import type { AdminMentor } from "@/lib/types";
import { Avatar } from "../Avatar";
import { Bi } from "../admin/Bi";
import { useAdmin } from "../admin/AdminShell";
import { errorText, useLoad } from "../admin/hooks";
import { Field, PageTitle, Panel } from "../admin/ui";

export function MentorProfile() {
  const { locale, a, token } = useAdmin();
  const { data } = useLoad(() => mentorApi.me(token), [token]);
  const [m, setM] = useState<AdminMentor | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { if (data) setM(data); }, [data]);
  if (!m) return <p className="text-mute">{a.common.loading}</p>;
  const t = a.mentors;
  const save = async () => { try { setM(await mentorApi.saveMe(token, m)); setMsg({ ok: true, text: a.common.saved }); } catch (e) { setMsg({ ok: false, text: errorText(a, e) }); } };
  return (
    <>
      <PageTitle actions={<button className="btn btn-gold" onClick={save}>{a.common.save}</button>}>{a.mp.profile.title}</PageTitle>
      <p className="mb-4 text-sm text-mute">{a.mp.profile.note}</p>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-xl p-3 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <Panel>
        <div className="space-y-4">
          <div className="flex items-center gap-4"><Avatar name={m.name[locale]} hue={m.hue} size={72} /><Field label={t.color} className="flex-1"><input type="range" min={0} max={359} value={m.hue} onChange={(e) => setM({ ...m, hue: +e.target.value })} className="w-full accent-[#c49c3e]" /></Field></div>
          <Bi a={a.common} label={t.name} value={m.name} onChange={(v) => setM({ ...m, name: v })} />
          <Bi a={a.common} label={t.jobTitle} value={m.title} onChange={(v) => setM({ ...m, title: v })} />
          <Bi a={a.common} label={t.bio} rows={4} value={m.bio} onChange={(v) => setM({ ...m, bio: v })} />
          <Field label={t.expertise}><input className="input" dir="ltr" value={m.expertise.join(", ")} onChange={(e) => setM({ ...m, expertise: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
        </div>
      </Panel>
    </>
  );
}
