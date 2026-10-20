"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { mentorApi } from "@/lib/mentor-api";
import { notify } from "@/lib/toast";
import type { Audience, Bilingual, Course, CourseModule, Lesson, Level, LiveSession, Mode, Offering, Quiz } from "@/lib/types";
import { Bi } from "./Bi";
import { useAdmin } from "./AdminShell";
import { errorText, useLoad, failMsg, okMsg } from "./hooks";
import { LessonWizard, type Step } from "./LessonWizard";
import { MaterialsEditor } from "./MaterialsEditor";
import { Badge, Field, PageTitle, Panel } from "./ui";

const E: Bilingual = { ar: "", en: "" };
const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;
const blank = (restricted: boolean): Course => ({
  id: "", slug: "", audience: "youth", level: "beginner", topic: "projects", title: { ...E }, subtitle: { ...E }, description: { ...E }, outcomes: [], modules: [],
  mentorId: "", rating: 0, reviewCount: 0, learners: 0, hours: 1, languages: ["ar"], offerings: [], featured: false, isNew: true, bestseller: false, certificate: true,
  published: !restricted, status: restricted ? "draft" : "approved", materials: [], quizzes: {},
});
// Sessions are entered in Riyadh time (UTC+3, no daylight saving) and stored in UTC.
const toInput = (iso: string) => new Date(+new Date(iso) + 3 * 3600e3).toISOString().slice(0, 16);
const fromInput = (v: string) => new Date(`${v}:00+03:00`).toISOString();
const newOffering = (mode: Mode): Offering => ({ id: "", mode, priceHalalas: 0, sessions: [], ...(mode === "recorded" ? {} : { capacity: 25, minLearners: 10 }) });
const STATUS_TONE = { draft: "sand", pending: "gold", approved: "green", rejected: "red" } as const;

/**
 * One editor for admins and mentors (`restricted` = mentor portal).
 *  - Admin: everything; courses they save are approved. A course a mentor submitted shows Approve / Send back.
 *  - Mentor, new or draft or sent back: everything except the flags; the course stays hidden until an admin approves it.
 *  - Mentor, live course: content, quizzes, files and live sessions only. Prices, slug, audience, publishing and offerings are locked.
 *  - Mentor, pending: read only. Withdraw it to edit.
 */
export function CourseEditor({ id, restricted = false }: { id: string; restricted?: boolean }) {
  const { locale, a, token } = useAdmin();
  const router = useRouter();
  const isNew = id === "new";
  const { data: loaded } = useLoad(() => (isNew ? Promise.resolve(blank(restricted)) : restricted ? mentorApi.course(token, id) : adminApi.course(token, id)), [id, token]);
  const { data: mentors } = useLoad(() => (restricted ? Promise.resolve([]) : adminApi.mentors(token)), [token]);
  const base = restricted ? `/${locale}/mentor/courses` : `/${locale}/admin/courses`;
  const [c, setC] = useState<Course | null>(null);
  const [outAr, setOutAr] = useState("");
  const [outEn, setOutEn] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<{ id: string; step: Step } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [publishOnApprove, setPublishOnApprove] = useState(true);
  const t = a.courses;

  useEffect(() => {
    if (!loaded) return;
    setC(loaded);
    setOutAr(loaded.outcomes.map((o) => o.ar).join("\n"));
    setOutEn(loaded.outcomes.map((o) => o.en).join("\n"));
  }, [loaded]);

  if (!c) return <p className="text-mute">{a.common.loading}</p>;
  const status = c.status ?? "approved";
  const draftMode = restricted && (isNew || status === "draft" || status === "rejected");
  const locked = restricted && !draftMode;        // live course in the mentor portal
  const readOnly = restricted && status === "pending";
  const set = <K extends keyof Course>(k: K, v: Course[K]) => setC((p) => (p ? { ...p, [k]: v } : p));

  const updMod = (mi: number, fn: (m: CourseModule) => CourseModule) => set("modules", c.modules.map((m, i) => (i === mi ? fn(m) : m)));
  const updLesson = (mi: number, li: number, patch: Partial<Lesson>) => updMod(mi, (m) => ({ ...m, lessons: m.lessons.map((l, i) => (i === li ? { ...l, ...patch } : l)) }));
  const moveLesson = (mi: number, li: number, dir: -1 | 1) => updMod(mi, (m) => {
    const ls = [...m.lessons]; const j = li + dir;
    if (j < 0 || j >= ls.length) return m;
    [ls[li], ls[j]] = [ls[j], ls[li]];
    return { ...m, lessons: ls };
  });
  const setQuiz = (lessonId: string, q: Quiz) => set("quizzes", { ...(c.quizzes ?? {}), [lessonId]: q });
  const updOff = (oi: number, fn: (o: Offering) => Offering) => set("offerings", c.offerings.map((o, i) => (i === oi ? fn(o) : o)));
  const updSes = (oi: number, si: number, patch: Partial<LiveSession>) => updOff(oi, (o) => ({ ...o, sessions: o.sessions.map((s, i) => (i === si ? { ...s, ...patch } : s)) }));

  const outcomes = () => {
    const ar = outAr.split("\n").map((s) => s.trim()).filter(Boolean);
    const en = outEn.split("\n").map((s) => s.trim()).filter(Boolean);
    return Array.from({ length: Math.max(ar.length, en.length) }, (_, i) => ({ ar: ar[i] ?? en[i] ?? "", en: en[i] ?? ar[i] ?? "" }));
  };
  /** Check what the server will also check, so the person sees the problem next to the form before anything is sent. */
  const problem = (): string | null => {
    const code = isNew && !c.slug.trim() ? "missing_slug" : !c.title.ar.trim() && !c.title.en.trim() ? "missing_title" : !restricted && !c.mentorId ? "missing_mentorId" : null;
    return code ? (a.common.errors as Record<string, string>)[code] : null;
  };
  /** Save and return the stored course. The caller decides what to do next. */
  const persist = async (): Promise<Course> => {
    const body = { ...c, outcomes: outcomes() };
    if (restricted) return isNew ? mentorApi.createCourse(token, body) : mentorApi.saveCourse(token, body);
    return adminApi.saveCourse(token, body, isNew);
  };
  const landed = (saved: Course) => { if (isNew) router.replace(`${base}/${saved.id}`); else setC(saved); };
  const run = async (fn: () => Promise<void>) => {
    const p = problem();
    if (p) { failMsg(setMsg, p); return; }
    setBusy(true); setMsg(null);
    try { await fn(); } catch (e) { failMsg(setMsg, errorText(a, e)); }
    setBusy(false);
  };

  const save = () => run(async () => { landed(await persist()); okMsg(setMsg, a.common.saved); });
  const submit = () => run(async () => {
    const saved = await persist();
    const sent = await mentorApi.submitCourse(token, saved.id);
    okMsg(setMsg, t.submitted);
    landed(sent);
  });
  const withdraw = () => run(async () => { const w = await mentorApi.withdrawCourse(token, c.id); setC(w); okMsg(setMsg, t.withdrawn); });
  const approve = () => run(async () => { const saved = await persist(); setC(await adminApi.approveCourse(token, saved.id, publishOnApprove)); okMsg(setMsg, t.approved); });
  const reject = () => run(async () => {
    if (!note.trim()) { failMsg(setMsg, (a.common.errors as Record<string, string>).missing_note); return; }
    const saved = await persist();
    setC(await adminApi.rejectCourse(token, saved.id, note)); setRejecting(false); setNote(""); okMsg(setMsg, t.rejected);
  });
  const makeLink = async (oi: number, si: number, sid: string) => {
    try { const url = await adminApi.ensureMeeting(token, sid); updSes(oi, si, { joinUrl: url }); notify.success(t.meetingCreated); }
    catch (e) { failMsg(setMsg, errorText(a, e)); }
  };
  const copy = async (url: string) => { try { await navigator.clipboard.writeText(url); notify.success(t.meetingCopied); } catch { notify.warning(url); } };

  const addLesson = (mi: number) => {
    const l: Lesson = { id: rid("l"), title: { ...E }, minutes: 10, kind: "video" };
    updMod(mi, (m) => ({ ...m, lessons: [...m.lessons, l] }));
    setOpen({ id: l.id, step: 0 });
  };

  const sel = "input";
  return (
    <>
      <PageTitle actions={
        <>
          <button className="btn btn-outline" onClick={() => router.push(base)}>{a.common.back}</button>
          {!readOnly && <button className="btn btn-outline" onClick={save} disabled={busy}>{busy ? a.common.saving : a.common.save}</button>}
          {restricted && (draftMode) && <button className="btn btn-gold" onClick={submit} disabled={busy}>{t.submit}</button>}
          {restricted && readOnly && <button className="btn btn-gold" onClick={withdraw} disabled={busy}>{t.withdraw}</button>}
        </>
      }>{isNew ? t.newTitle : t.editTitle}</PageTitle>

      {!isNew && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-white p-3 text-sm">
          <Badge tone={STATUS_TONE[status]}>{t.status[status]}</Badge>
          <span className="text-mute">{t.statusHelp[status]}</span>
        </div>
      )}
      {restricted && isNew && <p className="mb-4 rounded-2xl border border-gold/40 bg-gold/10 p-3 text-sm">{a.mp.draftNote}</p>}
      {locked && <p className="mb-4 rounded-2xl border border-gold/40 bg-gold/10 p-3 text-sm">{a.mp.restricted}</p>}
      {status === "rejected" && c.reviewNote && (
        <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><b>{t.reviewNote}:</b> {c.reviewNote}</div>
      )}
      {!restricted && status === "pending" && (
        <div className="mb-4 space-y-3 rounded-2xl border-2 border-gold bg-gold/10 p-4">
          <p className="font-black text-navy">{t.reviewBar}</p>
          <p className="text-sm">{t.proposedPrices}</p>
          {rejecting ? (
            <div className="space-y-2">
              <Field label={t.rejectTitle}><textarea className="input" rows={3} placeholder={t.rejectHint} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              <div className="flex gap-2"><button className="btn btn-navy !py-2 text-sm" onClick={reject} disabled={busy}>{t.reject}</button><button className="btn btn-outline !py-2 text-sm" onClick={() => setRejecting(false)}>{a.common.cancel}</button></div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <button className="btn btn-gold !py-2 text-sm" onClick={approve} disabled={busy}>✓ {t.approve}</button>
              <button className="btn btn-outline !py-2 text-sm" onClick={() => setRejecting(true)} disabled={busy}>{t.reject}</button>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-[#c49c3e]" checked={publishOnApprove} onChange={(e) => setPublishOnApprove(e.target.checked)} />{t.publishOnApprove}</label>
            </div>
          )}
        </div>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mb-4 rounded-xl p-3 text-sm font-medium ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      <fieldset disabled={readOnly} className="min-w-0 space-y-6">
        <Panel title={t.basics}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.slug} hint={t.slugHint}><input className="input" dir="ltr" value={c.slug} disabled={!isNew} onChange={(e) => set("slug", e.target.value.toLowerCase())} /></Field>
            <Field label={t.audienceField}><select className={sel} disabled={locked} value={c.audience} onChange={(e) => set("audience", e.target.value as Audience)}>{Object.entries(t.audiences).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={t.level}><select className={sel} disabled={locked} value={c.level} onChange={(e) => set("level", e.target.value as Level)}>{Object.entries(t.levels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label={t.topic}><select className={sel} disabled={locked} value={c.topic} onChange={(e) => set("topic", e.target.value)}>{Object.entries(t.topics).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            {!restricted && (
              <Field label={t.mentorField}>
                <select className={sel} value={c.mentorId} onChange={(e) => set("mentorId", e.target.value)}>
                  <option value="">-</option>{(mentors ?? []).map((m) => <option key={m.id} value={m.id}>{m.name[locale]}</option>)}
                </select>
              </Field>
            )}
            <Field label={t.hours}><input className="input" type="number" min={0} value={c.hours} onChange={(e) => set("hours", +e.target.value)} /></Field>
            <Field label={t.ageRange}><input className="input" dir="ltr" placeholder="6–9" value={c.ageRange ?? ""} onChange={(e) => set("ageRange", e.target.value)} /></Field>
            {!restricted && <Field label={t.cpd}><input className="input" type="number" min={0} value={c.cpdPoints ?? ""} onChange={(e) => set("cpdPoints", e.target.value === "" ? null : +e.target.value)} /></Field>}
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
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-[#c49c3e]" checked={c.certificate} disabled={locked} onChange={(e) => set("certificate", e.target.checked)} />{t.certificate}</label>
            {!restricted && ([["published", t.visible], ["featured", t.featured], ["isNew", t.isNew], ["bestseller", t.bestseller]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2" title={k === "published" && status !== "approved" ? t.statusHelp[status] : undefined}>
                <input type="checkbox" disabled={k === "published" && status !== "approved"} className="accent-[#c49c3e]" checked={k === "published" ? c.published !== false && status === "approved" : !!c[k]} onChange={(e) => set(k, e.target.checked as never)} />{l}
              </label>
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
          <div className="space-y-5">
            {c.modules.map((m, mi) => (
              <div key={m.id || mi} className="rounded-2xl border border-navy/10 p-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1"><Bi a={a.common} label={`${t.moduleTitle} ${mi + 1}`} value={m.title} onChange={(v) => updMod(mi, (x) => ({ ...x, title: v }))} /></div>
                  <button type="button" className="btn btn-outline !px-3 !py-2 text-red-600" aria-label={a.common.remove} onClick={() => set("modules", c.modules.filter((_, i) => i !== mi))}>✕</button>
                </div>
                <div className="mt-4 space-y-2">
                  {m.lessons.length === 0 && <p className="rounded-xl bg-sand/60 p-3 text-sm text-mute">{a.ed.emptyLessons}</p>}
                  {m.lessons.map((l, li) => (
                    <LessonWizard key={l.id || li} lesson={l} index={li} total={m.lessons.length} quiz={c.quizzes?.[l.id]} disabled={readOnly}
                      open={open?.id === l.id} step={open?.id === l.id ? open.step : 0}
                      onToggle={() => setOpen(open?.id === l.id ? null : { id: l.id, step: 0 })}
                      onStep={(s) => setOpen({ id: l.id, step: s })}
                      onLesson={(p) => updLesson(mi, li, p)} onQuiz={(q) => setQuiz(l.id, q)}
                      onRemove={() => updMod(mi, (x) => ({ ...x, lessons: x.lessons.filter((_, i) => i !== li) }))}
                      onMove={(d) => moveLesson(mi, li, d)} />
                  ))}
                  <button type="button" className="btn btn-outline !py-2 text-sm" onClick={() => addLesson(mi)}>+ {t.addLesson}</button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-outline" onClick={() => set("modules", [...c.modules, { id: rid("m"), title: { ...E }, lessons: [] }])}>+ {t.addModule}</button>
          </div>
        </Panel>

        <Panel title={t.materials}>
          <p className="mb-3 text-sm text-mute">{t.materialsHint}</p>
          <MaterialsEditor items={c.materials ?? []} onChange={(m) => set("materials", m)} />
        </Panel>

        <div id="offerings" className="scroll-mt-24">
          <Panel title={t.offeringsTitle}>
            <div className="space-y-4">
              {c.offerings.map((o, oi) => (
                <div key={o.id || oi} className="rounded-2xl border border-navy/10 p-4">
                  <div className="grid gap-3 md:grid-cols-[150px_130px_130px_110px_1fr_auto]">
                    <Field label={t.mode}>
                      <select className="input" disabled={locked} value={o.mode} onChange={(e) => {
                        const mode = e.target.value as Mode;
                        updOff(oi, (x) => ({ ...x, mode, capacity: mode === "recorded" ? null : x.capacity ?? 25, minLearners: mode === "recorded" ? null : x.minLearners ?? 10 }));
                      }}>{Object.entries(t.modes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                    </Field>
                    <Field label={t.price}><input className="input" type="number" min={0} step="0.01" dir="ltr" disabled={locked} value={o.priceHalalas / 100} onChange={(e) => updOff(oi, (x) => ({ ...x, priceHalalas: Math.round(+e.target.value * 100) }))} /></Field>
                    <Field label={t.compareAt}><input className="input" type="number" min={0} step="0.01" dir="ltr" disabled={locked} value={o.compareAtHalalas ? o.compareAtHalalas / 100 : ""} onChange={(e) => updOff(oi, (x) => ({ ...x, compareAtHalalas: e.target.value ? Math.round(+e.target.value * 100) : undefined }))} /></Field>
                    <Field label={t.accessDays}><input className="input" type="number" min={0} dir="ltr" disabled={locked} value={o.accessDays ?? ""} onChange={(e) => updOff(oi, (x) => ({ ...x, accessDays: e.target.value ? +e.target.value : undefined }))} /></Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label={`${t.cohort} (ar)`}><input className="input" dir="rtl" disabled={locked} value={o.cohortLabel?.ar ?? ""} onChange={(e) => updOff(oi, (x) => ({ ...x, cohortLabel: { ar: e.target.value, en: x.cohortLabel?.en ?? "" } }))} /></Field>
                      <Field label={`${t.cohort} (en)`}><input className="input" dir="ltr" disabled={locked} value={o.cohortLabel?.en ?? ""} onChange={(e) => updOff(oi, (x) => ({ ...x, cohortLabel: { ar: x.cohortLabel?.ar ?? "", en: e.target.value } }))} /></Field>
                    </div>
                    {!locked && <button type="button" className="self-end rounded-xl px-3 py-3 text-red-600 hover:bg-red-50" aria-label={a.common.remove} onClick={() => set("offerings", c.offerings.filter((_, i) => i !== oi))}>✕</button>}
                  </div>

                  {o.mode !== "recorded" && (
                    <div className="mt-4 rounded-2xl bg-sand/50 p-4">
                      <div className="grid gap-3 md:grid-cols-[170px_170px_1fr]">
                        <Field label={t.capacity}><input className="input" type="number" min={1} dir="ltr" disabled={locked} value={o.capacity ?? ""} onChange={(e) => updOff(oi, (x) => ({ ...x, capacity: e.target.value ? +e.target.value : null }))} /></Field>
                        <Field label={t.minLearners}><input className="input" type="number" min={1} dir="ltr" disabled={locked} value={o.minLearners ?? ""} onChange={(e) => updOff(oi, (x) => ({ ...x, minLearners: e.target.value ? +e.target.value : null }))} /></Field>
                        <div className="self-end text-xs text-mute">
                          {t.capacityHint}
                          {o.id && o.capacity ? (
                            <div className="mt-2">
                              <div className="h-2 overflow-hidden rounded-full bg-navy/10"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, ((o.enrolled ?? 0) / o.capacity) * 100)}%` }} /></div>
                              <b className="text-navy">{o.enrolled ?? 0} {t.of} {o.capacity} {t.booked}{o.minLearners ? ` · ${t.runsAt} ${o.minLearners}` : ""}</b>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <p className="mb-2 mt-4 text-sm font-bold text-navy">{t.sessions} <span className="font-normal text-mute">· {t.seatsAuto}</span></p>
                      <div className="space-y-3">
                        {o.sessions.map((s, si) => (
                          <div key={s.id || si} className="rounded-xl bg-white p-3">
                            <div className="grid items-center gap-2 md:grid-cols-[200px_100px_1fr_1fr_auto]">
                              <input className="input" type="datetime-local" dir="ltr" aria-label={t.startsAt} value={s.startsAt ? toInput(s.startsAt) : ""} onChange={(e) => e.target.value && updSes(oi, si, { startsAt: fromInput(e.target.value) })} />
                              <input className="input" type="number" min={15} aria-label={t.duration} placeholder={t.duration} value={s.durationMin} onChange={(e) => updSes(oi, si, { durationMin: +e.target.value })} />
                              <input className="input" dir="rtl" placeholder={`${t.sessionTitle} (ar)`} value={s.title.ar} onChange={(e) => updSes(oi, si, { title: { ...s.title, ar: e.target.value } })} />
                              <input className="input" dir="ltr" placeholder={`${t.sessionTitle} (en)`} value={s.title.en} onChange={(e) => updSes(oi, si, { title: { ...s.title, en: e.target.value } })} />
                              <button type="button" className="px-2 text-red-600" aria-label={a.common.remove} onClick={() => updOff(oi, (x) => ({ ...x, sessions: x.sessions.filter((_, i) => i !== si) }))}>✕</button>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-navy">🔗 {t.meetingLink}</span>
                              <input className="input max-w-xl flex-1 !py-2 text-sm" dir="ltr" placeholder={s.id ? t.meetingNone : t.meetingAuto} aria-label={t.meetingLink} value={s.joinUrl ?? ""} onChange={(e) => updSes(oi, si, { joinUrl: e.target.value, meetingProvider: e.target.value ? "manual" : null })} />
                              {s.meetingProvider && s.joinUrl && <Badge tone={s.meetingProvider === "google_meet" ? "green" : "sand"}>{t.meetingProvider[s.meetingProvider]}</Badge>}
                              {s.joinUrl && /^https:/.test(s.joinUrl) && <>
                                <button type="button" className="text-sm font-bold text-navy hover:underline" onClick={() => copy(s.joinUrl!)}>{t.meetingCopy}</button>
                                <a className="text-sm font-bold text-navy hover:underline" href={s.joinUrl} target="_blank" rel="noopener noreferrer">{t.meetingOpen} ↗</a>
                              </>}
                              {!restricted && s.id && !s.joinUrl && <button type="button" className="btn btn-outline !py-1.5 text-xs" onClick={() => makeLink(oi, si, s.id)}>{t.meetingCreate}</button>}
                            </div>
                            {s.meetingProvider === "fake" && <p className="mt-1 text-xs text-mute">{t.meetingAutoFake}</p>}
                          </div>
                        ))}
                        <button type="button" className="text-sm font-bold text-gold-deep hover:underline" onClick={() => updOff(oi, (x) => ({ ...x, sessions: [...x.sessions, { id: "", startsAt: new Date(Date.now() + 14 * 864e5).toISOString(), durationMin: 90, seats: x.capacity ?? 25, seatsLeft: x.capacity ?? 25, title: { ...E }, joinUrl: "" }] }))}>+ {t.addSession}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!locked && <button type="button" className="btn btn-outline" onClick={() => set("offerings", [...c.offerings, newOffering("recorded")])}>+ {t.addOffering}</button>}
            </div>
          </Panel>
        </div>
      </fieldset>

      <div className="sticky bottom-0 mt-6 flex flex-wrap justify-end gap-2 border-t border-navy/10 bg-white/90 py-3 backdrop-blur">
        {!readOnly && <button className="btn btn-outline" onClick={save} disabled={busy}>{busy ? a.common.saving : a.common.save}</button>}
        {restricted && draftMode && <button className="btn btn-gold" onClick={submit} disabled={busy}>{t.submit}</button>}
        {restricted && readOnly && <button className="btn btn-gold" onClick={withdraw} disabled={busy}>{t.withdraw}</button>}
      </div>
    </>
  );
}
