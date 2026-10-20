"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { mentorApi } from "@/lib/mentor-api";
import type { Audience, Bilingual, Course, CourseModule, Lesson, LessonKind, Level, LiveSession, Mode, Offering } from "@/lib/types";
import { Bi } from "./Bi";
import { useAdmin } from "./AdminShell";
import { errorText, useLoad } from "./hooks";
import { Field, PageTitle, Panel } from "./ui";

const E: Bilingual = { ar: "", en: "" };
const blank = (): Course => ({
  id: "", slug: "", audience: "youth", level: "beginner", topic: "projects", title: { ...E }, subtitle: { ...E }, description: { ...E }, outcomes: [], modules: [],
  mentorId: "", rating: 0, reviewCount: 0, learners: 0, hours: 1, languages: ["ar"], offerings: [], featured: false, isNew: true, bestseller: false, certificate: true, published: true,
});
// Sessions are entered in Riyadh time (UTC+3, no daylight saving) and stored in UTC.
const toInput = (iso: string) => new Date(+new Date(iso) + 3 * 3600e3).toISOString().slice(0, 16);
const fromInput = (v: string) => new Date(`${v}:00+03:00`).toISOString();

/** `restricted` = the mentor portal: content and live sessions only. Prices, slug, audience, flags and offerings are read-only (and ignored by the API). */
export function CourseEditor({ id, restricted = false }: { id: string; restricted?: boolean }) {
  const { locale, a, token } = useAdmin();
  const router = useRouter();
  const isNew = id === "new";
  const { data: loaded } = useLoad(() => (isNew ? Promise.resolve(blank()) : restricted ? mentorApi.course(token, id) : adminApi.course(token, id)), [id, token]);
  const { data: mentors } = useLoad(() => (restricted ? Promise.resolve([]) : adminApi.mentors(token)), [token]);
  const base = restricted ? `/${locale}/mentor/courses` : `/${locale}/admin/courses`;
  const [c, setC] = useState<Course | null>(null);
  const [outAr, setOutAr] = useState("");
  const [outEn, setOutEn] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const t = a.courses;

  useEffect(() => {
    if (!loaded) return;
    setC(loaded);
    setOutAr(loaded.outcomes.map((o) => o.ar).join("\n"));
    setOutEn(loaded.outcomes.map((o) => o.en).join("\n"));
  }, [loaded]);

  if (!c) return <p className="text-mute">{a.common.loading}</p>;
  const set = <K extends keyof Course>(k: K, v: Course[K]) => setC((p) => (p ? { ...p, [k]: v } : p));

  const updMod = (mi: number, fn: (m: CourseModule) => CourseModule) => set("modules", c.modules.map((m, i) => (i === mi ? fn(m) : m)));
  const updLesson = (mi: number, li: number, patch: Partial<Lesson>) => updMod(mi, (m) => ({ ...m, lessons: m.lessons.map((l, i) => (i === li ? { ...l, ...patch } : l)) }));
  const updOff = (oi: number, fn: (o: Offering) => Offering) => set("offerings", c.offerings.map((o, i) => (i === oi ? fn(o) : o)));
  const updSes = (oi: number, si: number, patch: Partial<LiveSession>) => updOff(oi, (o) => ({ ...o, sessions: o.sessions.map((s, i) => (i === si ? { ...s, ...patch } : s)) }));

  const save = async () => {
    setBusy(true); setMsg(null);
    const ar = outAr.split("\n").map((s) => s.trim()).filter(Boolean);
    const en = outEn.split("\n").map((s) => s.trim()).filter(Boolean);
    const outcomes = Array.from({ length: Math.max(ar.length, en.length) }, (_, i) => ({ ar: ar[i] ?? en[i] ?? "", en: en[i] ?? ar[i] ?? "" }));
    try {
      const saved = restricted ? await mentorApi.saveCourse(token, { ...c, outcomes }) : await adminApi.saveCourse(token, { ...c, outcomes }, isNew);
      setMsg({ ok: true, text: a.common.saved });
      if (isNew) router.replace(`${base}/${saved.id}`);
      else setC(saved);
    } catch (e) { setMsg({ ok: false, text: errorText(a, e) }); }
    setBusy(false);
  };

  const sel = "input";
  return (
    <>
      <PageTitle actions={
        <>
          <button className="btn btn-outline" onClick={() => router.push(base)}>{a.common.back}</button>
          <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? a.common.saving : a.common.save}</button>
        </>
      }>{isNew ? t.newTitle : t.editTitle}</PageTitle>
      {restricted && <p className="mb-4 rounded-2xl border border-gold/40 bg-gold/10 p-3 text-sm">{a.mp.restricted}</p>}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-xl p-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      <div className="space-y-6">
        <Panel title={t.basics}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.slug} hint={t.slugHint}><input className="input" dir="ltr" value={c.slug} disabled={!isNew || restricted} onChange={(e) => set("slug", e.target.value.toLowerCase())} /></Field>
            <Field label={t.audienceField}><select className={sel} disabled={restricted} value={c.audience} onChange={(e) => set("audience", e.target.value as Audience)}>{Object.entries(t.audiences).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={t.level}><select className={sel} disabled={restricted} value={c.level} onChange={(e) => set("level", e.target.value as Level)}>{Object.entries(t.levels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={t.topic}><select className={sel} disabled={restricted} value={c.topic} onChange={(e) => set("topic", e.target.value)}>{Object.entries(t.topics).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={t.mentorField}>
              <select className={sel} disabled={restricted} value={c.mentorId} onChange={(e) => set("mentorId", e.target.value)}>
                <option value="">-</option>{(mentors ?? []).map((m) => <option key={m.id} value={m.id}>{m.name[locale]}</option>)}
              </select>
            </Field>
            <Field label={t.hours}><input className="input" type="number" min={0} value={c.hours} onChange={(e) => set("hours", +e.target.value)} /></Field>
            <Field label={t.ageRange}><input className="input" dir="ltr" placeholder="6–9" value={c.ageRange ?? ""} onChange={(e) => set("ageRange", e.target.value)} /></Field>
            <Field label={t.cpd}><input className="input" type="number" min={0} disabled={restricted} value={c.cpdPoints ?? ""} onChange={(e) => set("cpdPoints", e.target.value === "" ? null : +e.target.value)} /></Field>
            <div>
              <span className="mb-1.5 block text-sm font-bold text-navy">{t.languages}</span>
              <div className="flex gap-4 pt-2 text-sm">
                {(["ar", "en"] as const).map((l) => (
                  <label key={l} className="flex items-center gap-2"><input type="checkbox" className="accent-[#c49c3e]" checked={c.languages.includes(l)} onChange={(e) => set("languages", e.target.checked ? [...c.languages, l] : c.languages.filter((x) => x !== l))} />{l === "ar" ? a.common.arabic : a.common.english}</label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {([["published", t.visible], ["featured", t.featured], ["isNew", t.isNew], ["bestseller", t.bestseller], ["certificate", t.certificate]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" disabled={restricted} className="accent-[#c49c3e]" checked={k === "published" ? c.published !== false : !!c[k]} onChange={(e) => set(k, e.target.checked as never)} />{l}</label>
            ))}
          </div>
        </Panel>

        <Panel title={t.text}>
          <div className="space-y-4">
            <Bi a={a.common} label={t.titleField} value={c.title} onChange={(v) => set("title", v)} />
            <Bi a={a.common} label={t.subtitleField} value={c.subtitle} onChange={(v) => set("subtitle", v)} />
            <Bi a={a.common} label={t.descriptionField} rows={4} value={c.description} onChange={(v) => set("description", v)} />
            <div>
              <span className="mb-1.5 block text-sm font-bold text-navy">{t.outcomesField}</span>
              <div className="grid gap-2 md:grid-cols-2">
                <textarea className="input" rows={4} dir="rtl" placeholder={a.common.arabic} value={outAr} onChange={(e) => setOutAr(e.target.value)} />
                <textarea className="input" rows={4} dir="ltr" placeholder={a.common.english} value={outEn} onChange={(e) => setOutEn(e.target.value)} />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title={t.syllabus}>
          <div className="space-y-4">
            {c.modules.map((m, mi) => (
              <div key={m.id || mi} className="rounded-2xl border border-navy/10 p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1"><Bi a={a.common} label={`${t.moduleTitle} ${mi + 1}`} value={m.title} onChange={(v) => updMod(mi, (x) => ({ ...x, title: v }))} /></div>
                  <button className="btn btn-outline !px-3 !py-2 text-red-600" aria-label={a.common.remove} onClick={() => set("modules", c.modules.filter((_, i) => i !== mi))}>✕</button>
                </div>
                <div className="mt-3 space-y-2">
                  {m.lessons.map((l, li) => (
                    <div key={l.id || li} className="grid items-center gap-2 rounded-xl bg-sand/60 p-2 md:grid-cols-[1fr_1fr_90px_130px_auto_auto]">
                      <input className="input" dir="rtl" placeholder={`${t.lessonTitle} (ar)`} value={l.title.ar} onChange={(e) => updLesson(mi, li, { title: { ...l.title, ar: e.target.value } })} />
                      <input className="input" dir="ltr" placeholder={`${t.lessonTitle} (en)`} value={l.title.en} onChange={(e) => updLesson(mi, li, { title: { ...l.title, en: e.target.value } })} />
                      <input className="input" type="number" min={0} aria-label={t.minutes} placeholder={t.minutes} value={l.minutes} onChange={(e) => updLesson(mi, li, { minutes: +e.target.value })} />
                      <select className="input" aria-label={t.kind} value={l.kind} onChange={(e) => updLesson(mi, li, { kind: e.target.value as LessonKind })}>{Object.entries(t.kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" className="accent-[#c49c3e]" checked={!!l.preview} onChange={(e) => updLesson(mi, li, { preview: e.target.checked })} />{t.preview}</label>
                      <button className="px-2 text-red-600" aria-label={a.common.remove} onClick={() => updMod(mi, (x) => ({ ...x, lessons: x.lessons.filter((_, i) => i !== li) }))}>✕</button>
                    </div>
                  ))}
                  <button className="text-sm font-bold text-gold-deep hover:underline" onClick={() => updMod(mi, (x) => ({ ...x, lessons: [...x.lessons, { id: "", title: { ...E }, minutes: 10, kind: "video" }] }))}>+ {t.addLesson}</button>
                </div>
              </div>
            ))}
            <button className="btn btn-outline" onClick={() => set("modules", [...c.modules, { id: "", title: { ...E }, lessons: [] }])}>+ {t.addModule}</button>
          </div>
        </Panel>

        <Panel title={t.offeringsTitle}>
          <div className="space-y-4">
            {c.offerings.map((o, oi) => (
              <div key={o.id || oi} className="rounded-2xl border border-navy/10 p-4">
                <div className="grid gap-3 md:grid-cols-[150px_130px_130px_110px_1fr_auto]">
                  <Field label={t.mode}><select className="input" disabled={restricted} value={o.mode} onChange={(e) => updOff(oi, (x) => ({ ...x, mode: e.target.value as Mode }))}>{Object.entries(t.modes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                  <Field label={t.price}><input className="input" type="number" min={0} step="0.01" dir="ltr" disabled={restricted} value={o.priceHalalas / 100} onChange={(e) => updOff(oi, (x) => ({ ...x, priceHalalas: Math.round(+e.target.value * 100) }))} /></Field>
                  <Field label={t.compareAt}><input className="input" type="number" min={0} step="0.01" dir="ltr" disabled={restricted} value={o.compareAtHalalas ? o.compareAtHalalas / 100 : ""} onChange={(e) => updOff(oi, (x) => ({ ...x, compareAtHalalas: e.target.value ? Math.round(+e.target.value * 100) : undefined }))} /></Field>
                  <Field label={t.accessDays}><input className="input" type="number" min={0} dir="ltr" disabled={restricted} value={o.accessDays ?? ""} onChange={(e) => updOff(oi, (x) => ({ ...x, accessDays: e.target.value ? +e.target.value : undefined }))} /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label={`${t.cohort} (ar)`}><input className="input" dir="rtl" disabled={restricted} value={o.cohortLabel?.ar ?? ""} onChange={(e) => updOff(oi, (x) => ({ ...x, cohortLabel: { ar: e.target.value, en: x.cohortLabel?.en ?? "" } }))} /></Field>
                    <Field label={`${t.cohort} (en)`}><input className="input" dir="ltr" disabled={restricted} value={o.cohortLabel?.en ?? ""} onChange={(e) => updOff(oi, (x) => ({ ...x, cohortLabel: { ar: x.cohortLabel?.ar ?? "", en: e.target.value } }))} /></Field>
                  </div>
                  {!restricted && <button className="self-end rounded-xl px-3 py-3 text-red-600 hover:bg-red-50" aria-label={a.common.remove} onClick={() => set("offerings", c.offerings.filter((_, i) => i !== oi))}>✕</button>}
                </div>
                {o.mode !== "recorded" && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-bold text-navy">{t.sessions}</p>
                    <div className="space-y-2">
                      {o.sessions.map((s, si) => (
                        <div key={s.id || si} className="grid items-center gap-2 rounded-xl bg-sand/60 p-2 md:grid-cols-[200px_100px_90px_1fr_1fr_auto]">
                          <input className="input" type="datetime-local" dir="ltr" aria-label={t.startsAt} value={s.startsAt ? toInput(s.startsAt) : ""} onChange={(e) => e.target.value && updSes(oi, si, { startsAt: fromInput(e.target.value) })} />
                          <input className="input" type="number" min={15} aria-label={t.duration} placeholder={t.duration} value={s.durationMin} onChange={(e) => updSes(oi, si, { durationMin: +e.target.value })} />
                          <input className="input" type="number" min={1} aria-label={t.seats} placeholder={t.seats} value={s.seats} onChange={(e) => updSes(oi, si, { seats: +e.target.value })} />
                          <input className="input" dir="rtl" placeholder={`${t.sessionTitle} (ar)`} value={s.title.ar} onChange={(e) => updSes(oi, si, { title: { ...s.title, ar: e.target.value } })} />
                          <input className="input" dir="ltr" placeholder={`${t.sessionTitle} (en)`} value={s.title.en} onChange={(e) => updSes(oi, si, { title: { ...s.title, en: e.target.value } })} />
                          <button className="px-2 text-red-600" aria-label={a.common.remove} onClick={() => updOff(oi, (x) => ({ ...x, sessions: x.sessions.filter((_, i) => i !== si) }))}>✕</button>
                        </div>
                      ))}
                      <button className="text-sm font-bold text-gold-deep hover:underline" onClick={() => updOff(oi, (x) => ({ ...x, sessions: [...x.sessions, { id: "", startsAt: new Date(Date.now() + 14 * 864e5).toISOString(), durationMin: 90, seats: 25, seatsLeft: 25, title: { ...E } }] }))}>+ {t.addSession}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!restricted && <button className="btn btn-outline" onClick={() => set("offerings", [...c.offerings, { id: "", mode: "recorded", priceHalalas: 0, sessions: [] }])}>+ {t.addOffering}</button>}
          </div>
        </Panel>
      </div>
      <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-navy/10 bg-white/90 py-3 backdrop-blur">
        <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? a.common.saving : a.common.save}</button>
      </div>
    </>
  );
}
