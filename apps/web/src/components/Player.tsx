"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fileUrl, userApi } from "@/lib/api";
import { dateTime, num, tr, type Dict } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { videoSource } from "@/lib/video";
import { Progress } from "./Progress";
import type { Course, CourseContent, Enrollment, Lesson, Locale, Material, Quiz, QuizResult } from "@/lib/types";

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

function LessonVideo({ lesson, token, t }: { lesson: Lesson; token: string; t: Dict }) {
  const v = lesson.video;
  if (!v || (!v.fileId && !v.url)) return <p className="max-w-md text-white/70">{t.learn.videoMissing}</p>;
  const raw = v.fileId ? `/api/v1/files/${v.fileId}` : v.url!;
  const src = v.fileId ? { kind: "video" as const, src: fileUrl(raw, token) } : videoSource(raw);
  return src.kind === "iframe"
    ? <iframe key={src.src} src={src.src} title={lesson.id} className="absolute inset-0 h-full w-full" allow="fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    : <video key={src.src} src={src.src} controls controlsList="nodownload" playsInline preload="metadata" className="absolute inset-0 h-full w-full bg-black" />;
}

function Files({ title, items, token, t }: { title: string; items: Material[]; token: string; t: Dict }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 font-bold text-navy">{title}</h2>
      <ul className="space-y-2">
        {items.map((m) => (
          <li key={m.id} className="card flex items-center justify-between gap-3 p-3 text-sm">
            <span className="min-w-0 truncate">📎 {m.name}</span>
            <a className="shrink-0 font-bold text-gold-deep hover:underline" href={fileUrl(m.url, token)} target="_blank" rel="noopener noreferrer" download>{t.learn.download}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuizPanel({ course, lesson, token, locale, t, done, onPassed }: { course: Course; lesson: Lesson; token: string; locale: Locale; t: Dict; done: boolean; onPassed: (e: Enrollment | null) => void }) {
  const toast = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);
  useEffect(() => { setQuiz(null); setAnswers({}); setResult(null); setMissing(false); userApi.quiz(token, course.slug, lesson.id).then(setQuiz).catch(() => toast.error(t.toast.network)); }, [token, course.slug, lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!quiz) return <p className="mt-4 text-mute">{t.common.loading}</p>;
  const l = t.learn;
  const submit = async () => {
    if (quiz.questions.some((q) => !answers[q.id])) { setMissing(true); toast.warning(l.quizAnswerAll); return; }
    setBusy(true);
    try {
      const r = await userApi.submitQuiz(token, course.slug, lesson.id, answers);
      setResult(r);
      if (r.passed) { toast.success(fill(l.quizPassed, { score: r.scorePct, c: r.correct, n: r.total })); onPassed(r.enrollment); }
      else toast.warning(fill(l.quizFailed, { score: r.scorePct, c: r.correct, n: r.total, pct: r.passPct }));
    } catch { toast.error(t.toast.network); }
    setBusy(false);
  };
  const byId = Object.fromEntries((result?.results ?? []).map((r) => [r.id, r]));
  return (
    <section className="card mt-6 space-y-5 p-5">
      <div><h2 className="font-black text-navy">{l.quiz}{done && <span className="ms-2 text-sm text-emerald-700">✓ {l.done}</span>}</h2><p className="text-sm text-mute">{fill(l.quizIntro, { pct: quiz.passPct })}</p></div>
      {quiz.questions.map((q, qi) => {
        const r = byId[q.id];
        return (
          <fieldset key={q.id} className="space-y-2" disabled={!!result?.passed}>
            <legend className="mb-1 font-bold text-navy">{num(qi + 1, locale)}. {tr(q.prompt, locale)}</legend>
            {q.options.map((o) => {
              const picked = answers[q.id] === o.id;
              const tone = r ? (o.id === r.correctId ? "border-emerald-500 bg-emerald-50" : picked ? "border-red-400 bg-red-50" : "border-navy/10") : picked ? "border-gold bg-sand" : missing && !answers[q.id] ? "border-red-300" : "border-navy/10";
              return (
                <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-sm ${tone}`}>
                  <input type="radio" className="accent-[#c49c3e]" name={`${lesson.id}-${q.id}`} checked={picked} onChange={() => { setAnswers({ ...answers, [q.id]: o.id }); setResult(null); }} />
                  <span>{tr(o.text, locale)}</span>
                </label>
              );
            })}
            {r && <p className={`text-sm font-medium ${r.correct ? "text-emerald-700" : "text-red-700"}`}>{r.correct ? `✓ ${l.quizCorrect}` : `✕ ${l.quizWrong}`}{r.explanation && <span className="block font-normal text-mute">{tr(r.explanation, locale)}</span>}</p>}
          </fieldset>
        );
      })}
      {result && <p role="status" className={`rounded-xl p-3 text-sm font-bold ${result.passed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{fill(result.passed ? l.quizPassed : l.quizFailed, { score: result.scorePct, c: result.correct, n: result.total, pct: result.passPct })}</p>}
      {!result?.passed && <button className="btn btn-gold" onClick={submit} disabled={busy}>{result ? l.quizRetry : l.quizSubmit}</button>}
    </section>
  );
}

export function Player({ course, locale, t }: { course: Course; locale: Locale; t: Dict }) {
  const { token, ready } = useAuth();
  const toast = useToast();
  const [enr, setEnr] = useState<Enrollment | null | undefined>(undefined);
  const [content, setContent] = useState<CourseContent | null>(null);
  const [joining, setJoining] = useState(false);
  const modules = content?.modules ?? course.modules;
  const lessons = modules.flatMap((m) => m.lessons);
  const [cur, setCur] = useState(course.modules[0]?.lessons[0]?.id ?? "");
  useEffect(() => { if (token) userApi.enrollments(token).then((l) => setEnr(l.find((e) => e.courseSlug === course.slug) ?? null)).catch(() => setEnr(null)); }, [token, course.slug]);
  // Videos, files and quizzes are only sent to enrolled learners.
  useEffect(() => { if (token && enr) userApi.content(token, course.slug).then(setContent).catch(() => setContent(null)); }, [token, enr?.id, course.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (ready && !token) return <div className="container-x py-24 text-center"><Link className="btn btn-gold" href={`/${locale}/login?next=/${locale}/learn/${course.slug}`}>{t.my.needLogin}</Link></div>;
  if (enr === null) return <div className="container-x py-24 text-center"><p className="mb-4">{t.my.empty}</p><Link className="btn btn-gold" href={`/${locale}/courses/${course.slug}`}>{t.course.enroll}</Link></div>;
  if (!enr || !token) return <div className="container-x py-24 text-center text-mute">{t.common.loading}</div>;

  const lesson = lessons.find((l) => l.id === cur) ?? lessons[0];
  const done = enr.completedLessonIds.includes(lesson.id);
  const idx = lessons.findIndex((l) => l.id === lesson.id);
  const advance = (e: Enrollment) => {
    const nxt = lessons.find((l) => !e.completedLessonIds.includes(l.id) && lessons.indexOf(l) > idx) ?? lessons.find((l) => !e.completedLessonIds.includes(l.id));
    if (nxt) setCur(nxt.id);
  };
  const finished = (e: Enrollment, before: Enrollment) => { setEnr(e); if (e.progressPct === 100 && !before.certificateCode) toast.success(t.toast.courseDone); else toast.success(t.toast.lessonDone); };
  const mark = async () => {
    try { const e = await userApi.completeLesson(token, course.slug, lesson.id); finished(e, enr); advance(e); }
    catch { toast.error(t.toast.network); }
  };
  const join = async () => {
    if (!enr.nextSession) return;
    const w = window.open("", "_blank"); // opened inside the click so pop-up blockers allow it
    setJoining(true);
    try {
      const url = await userApi.joinSession(token, enr.nextSession.id);
      if (w) { w.opener = null; w.location.href = url; } else window.location.href = url;
    } catch { w?.close(); toast.error(t.learn.joinFailed); }
    setJoining(false);
  };

  return (
    <div className="container-x grid gap-6 py-8 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        {lesson.kind === "live" ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl bg-navy p-8 text-center text-white">
            {enr.nextSession ? (
              <>
                <p className="text-sm text-white/70">{t.learn.nextSession}</p>
                <p className="text-xl font-black">{tr(enr.nextSession.title, locale) || tr(lesson.title, locale)}</p>
                <p className="text-gold-light" dir="ltr">{dateTime(enr.nextSession.startsAt, locale)}</p>
                <button onClick={join} disabled={joining} className="btn btn-gold mt-2">{joining ? t.learn.joining : `🎥 ${t.learn.joinLive}`}</button>
                <p className="max-w-sm text-xs text-white/60">{t.learn.liveNotice}</p>
              </>
            ) : <p className="max-w-md text-white/70">{t.learn.liveRoomPlaceholder}</p>}
          </div>
        ) : lesson.kind === "video" ? (
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl bg-navy p-8 text-center text-white">
            {content ? <LessonVideo lesson={lesson} token={token} t={t} /> : <p className="max-w-md text-white/70">{t.learn.videoPlaceholder}</p>}
          </div>
        ) : null}
        <p className="mt-5 text-sm font-bold text-gold-deep">{t.prog.lessonN.replace("{n}", num(idx + 1, locale)).replace("{total}", num(lessons.length, locale))}</p>
        <h1 className="mt-1 text-2xl font-black text-navy">{tr(lesson.title, locale)}</h1>
        {lesson.description && tr(lesson.description, locale) && <p className="mt-2 whitespace-pre-line text-mute">{tr(lesson.description, locale)}</p>}
        {lesson.hasQuiz
          ? <QuizPanel course={course} lesson={lesson} token={token} locale={locale} t={t} done={done} onPassed={(e) => { if (e) { finished(e, enr); advance(e); } }} />
          : <button onClick={mark} disabled={done} className="btn btn-gold mt-4">{done ? `✓ ${t.learn.done}` : t.learn.markDone}</button>}
        <Files title={t.learn.materials} items={lesson.materials ?? []} token={token} t={t} />
        <Files title={t.learn.courseMaterials} items={content?.materials ?? []} token={token} t={t} />
        {enr.certificateCode && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-medium text-emerald-900">🎓 {t.learn.complete} <b dir="ltr">{enr.certificateCode}</b></p><Link className="btn btn-navy !py-2 text-sm" href={`/${locale}/certificate/${enr.certificateCode}`}>{t.cert.view}</Link></div>}
      </div>
      <aside className="card h-fit overflow-hidden">
        <div className="space-y-3 border-b border-navy/10 p-5"><b className="text-navy">{t.learn.lessonList}</b><Progress pct={enr.progressPct} done={enr.completedLessonIds.length} total={lessons.length} locale={locale} t={t} /></div>
        {modules.map((m) => (
          <div key={m.id}>
            <p className="bg-sand/70 px-4 py-2 text-xs font-bold text-navy">{tr(m.title, locale)}</p>
            {m.lessons.map((l) => (
              <button key={l.id} onClick={() => setCur(l.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-start text-sm ${l.id === lesson.id ? "bg-gold/15 font-bold" : "hover:bg-sand/50"}`}>
                <span className={enr.completedLessonIds.includes(l.id) ? "text-gold-deep" : "text-navy/25"}>{enr.completedLessonIds.includes(l.id) ? "✓" : "○"}</span>
                <span className="flex-1">{tr(l.title, locale)}</span><span className="text-xs text-mute">{num(l.minutes, locale)}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>
    </div>
  );
}
