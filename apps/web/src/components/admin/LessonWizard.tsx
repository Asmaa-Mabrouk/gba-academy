"use client";
import { useState } from "react";
import { fileUrl, isMock } from "@/lib/api";
import { videoSource } from "@/lib/video";
import type { Lesson, LessonKind, Quiz } from "@/lib/types";
import { Bi } from "./Bi";
import { useAdmin } from "./AdminShell";
import { FileUpload } from "./FileUpload";
import { MaterialsEditor } from "./MaterialsEditor";
import { QuizDesigner, quizIssues } from "./QuizDesigner";

export type Step = 0 | 1 | 2 | 3;
const KIND_ICON: Record<LessonKind, string> = { video: "🎬", live: "📡", quiz: "❓", resource: "📄" };

/** Public: used by the editor to know if a lesson still needs work. */
export function lessonReady(l: Lesson, quiz: Quiz | undefined): boolean {
  const titled = !!(l.title.ar.trim() || l.title.en.trim());
  if (!titled) return false;
  if (l.kind === "video") return !!(l.video?.fileId || l.video?.url);
  if (l.kind === "quiz") return quizIssues(quiz).length === 0;
  return true;
}

/**
 * One lesson of the syllabus. Closed it is a summary row; open it is a four-step flow shown as progress bubbles:
 * 1 Basics (title, type, duration) -> 2 Content (video upload / quiz designer / ...) -> 3 Files (attachments) -> 4 Review.
 */
export function LessonWizard({ lesson, index, total, quiz, open, step, disabled, onToggle, onStep, onLesson, onQuiz, onRemove, onMove }: {
  lesson: Lesson; index: number; total: number; quiz: Quiz | undefined; open: boolean; step: Step; disabled: boolean;
  onToggle: () => void; onStep: (s: Step) => void; onLesson: (p: Partial<Lesson>) => void; onQuiz: (q: Quiz) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void;
}) {
  const { locale, a, token } = useAdmin();
  const t = a.ed;
  const c = a.courses;
  const [link, setLink] = useState("");
  const mats = lesson.materials ?? [];
  const hasTitle = !!(lesson.title.ar.trim() || lesson.title.en.trim());
  const bothTitles = !!(lesson.title.ar.trim() && lesson.title.en.trim());
  const issues = quizIssues(quiz);
  const contentOk = lesson.kind === "video" ? !!(lesson.video?.fileId || lesson.video?.url) : lesson.kind === "quiz" ? issues.length === 0 : true;
  const stepDone = [hasTitle, contentOk, mats.length > 0 || step > 2, step === 3 && hasTitle && contentOk];
  const names = [t.steps.basics, t.steps.content, t.steps.materials, t.steps.review];
  const title = lesson.title[locale] || lesson.title.ar || lesson.title.en || t.untitled;

  const videoSrc = lesson.video?.fileId ? fileUrl(`/api/v1/files/${lesson.video.fileId}`, token) : lesson.video?.url ?? "";
  const vs = videoSrc ? videoSource(videoSrc) : null;
  const setVideo = (v: Lesson["video"]) => onLesson({ video: v });

  return (
    <div className={`rounded-2xl border transition ${open ? "border-gold/60 bg-white shadow-md" : "border-navy/10 bg-sand/40"}`}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-start" aria-expanded={open} onClick={onToggle}>
          <span className={`bubble shrink-0 ${lessonReady(lesson, quiz) ? "bubble-done" : ""}`}>{lessonReady(lesson, quiz) ? "✓" : index + 1}</span>
          <span className="min-w-0">
            <b className="block truncate text-navy">{title}</b>
            <span className="flex flex-wrap items-center gap-1.5 text-xs text-mute">
              <span>{KIND_ICON[lesson.kind]} {c.kinds[lesson.kind]}</span>
              {lesson.minutes > 0 && <span>· {lesson.minutes} {c.minutes}</span>}
              {lesson.kind === "video" && !contentOk && <span className="chip bg-amber-100 text-amber-800">{t.missing}: {t.steps.content}</span>}
              {lesson.kind === "quiz" && <span className={`chip ${issues.length ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{quiz?.questions.length ?? 0} {t.quiz.questionsN}</span>}
              {mats.length > 0 && <span className="chip bg-sand text-navy">📎 {mats.length}</span>}
              {lesson.preview && <span className="chip bg-gold/20 text-gold-deep">{c.preview}</span>}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-lg px-2 py-1 text-sm hover:bg-white disabled:opacity-30" disabled={disabled || index === 0} aria-label={t.moveUp} onClick={() => onMove(-1)}>▲</button>
          <button type="button" className="rounded-lg px-2 py-1 text-sm hover:bg-white disabled:opacity-30" disabled={disabled || index === total - 1} aria-label={t.moveDown} onClick={() => onMove(1)}>▼</button>
          <button type="button" className="rounded-lg px-3 py-1 text-sm font-bold text-navy hover:bg-white" onClick={onToggle}>{open ? t.collapse : t.open}</button>
          <button type="button" className="rounded-lg px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-30" disabled={disabled} aria-label={a.common.remove} onClick={onRemove}>✕</button>
        </div>
      </div>

      {open && (
        <div className="border-t border-navy/10 p-4">
          <ol className="mb-5 flex items-center" aria-label={t.lessonN}>
            {names.map((n, i) => (
              <li key={n} className="flex flex-1 items-center last:flex-none">
                <button type="button" onClick={() => onStep(i as Step)} className="flex flex-col items-center gap-1" aria-current={step === i ? "step" : undefined}>
                  <span className={`bubble ${step === i ? "bubble-current" : stepDone[i] ? "bubble-done" : ""}`}>{step !== i && stepDone[i] ? "✓" : i + 1}</span>
                  <span className={`text-[11px] font-bold ${step === i ? "text-navy" : "text-mute"}`}>{n}</span>
                </button>
                {i < 3 && <span className={`bubble-line mx-1 mb-4 ${stepDone[i] && step > i ? "bubble-line-done" : ""}`} />}
              </li>
            ))}
          </ol>

          <fieldset disabled={disabled} className="min-w-0 space-y-4">
            {step === 0 && (
              <>
                <Bi a={a.common} label={c.lessonTitle} value={lesson.title} onChange={(v) => onLesson({ title: v })} />
                <div>
                  <span className="mb-1.5 block text-sm font-bold text-navy">{c.kind}</span>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {(Object.keys(c.kinds) as LessonKind[]).map((k) => (
                      <button key={k} type="button" onClick={() => onLesson({ kind: k })} aria-pressed={lesson.kind === k}
                        className={`rounded-2xl border-2 p-3 text-center transition ${lesson.kind === k ? "border-gold bg-gold/10" : "border-navy/10 hover:border-navy/30"}`}>
                        <span className="block text-2xl" aria-hidden>{KIND_ICON[k]}</span>
                        <b className="block text-sm text-navy">{c.kinds[k]}</b>
                        <span className="block text-[11px] leading-snug text-mute">{t.kindHint[k]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-6">
                  <label className="block text-sm font-bold text-navy">{c.minutes}
                    <input type="number" min={0} className="input mt-1.5 !w-28 !py-2" dir="ltr" value={lesson.minutes} onChange={(e) => onLesson({ minutes: Math.max(0, +e.target.value) })} />
                  </label>
                  <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" className="accent-[#c49c3e]" checked={!!lesson.preview} onChange={(e) => onLesson({ preview: e.target.checked })} />{c.preview}</label>
                </div>
              </>
            )}

            {step === 1 && lesson.kind === "video" && (
              <>
                <span className="block text-sm font-bold text-navy">{t.video}</span>
                {vs ? (
                  <div className="space-y-3">
                    <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                      {vs.kind === "iframe"
                        ? <iframe src={vs.src} title={title} className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
                        : <video src={vs.src} controls preload="metadata" className="h-full w-full" />}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="chip bg-emerald-100 text-emerald-800">✓ {lesson.video?.fileId || isMock ? t.videoReady : t.videoLink}{lesson.video?.name ? ` · ${lesson.video.name}` : ""}</span>
                      <button type="button" className="text-sm font-bold text-red-600 hover:underline" onClick={() => setVideo(undefined)}>{t.videoRemove}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileUpload kind="video" variant="zone" label={t.videoDrop} hint={t.videoHint}
                      onDone={(f) => setVideo(isMock ? { url: f.url, name: f.name } : { fileId: f.id, name: f.name })} />
                    <div className="flex flex-wrap items-end gap-2">
                      <input className="input max-w-md !py-2" dir="ltr" placeholder={t.videoOrLink} aria-label={t.videoOrLink} value={link} onChange={(e) => setLink(e.target.value)} />
                      <button type="button" className="btn btn-outline !py-2 text-sm" disabled={!/^https:\/\/\S+$/.test(link.trim())} onClick={() => { setVideo({ url: link.trim() }); setLink(""); }}>{t.addLink}</button>
                    </div>
                  </>
                )}
                <Bi a={a.common} label={t.lessonDescription} rows={3} value={lesson.description ?? { ar: "", en: "" }} onChange={(v) => onLesson({ description: v })} />
              </>
            )}
            {step === 1 && lesson.kind === "quiz" && <QuizDesigner quiz={quiz} onChange={onQuiz} disabled={disabled} />}
            {step === 1 && lesson.kind === "live" && (
              <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">
                <p>{t.liveNote}</p>
                <a href="#offerings" className="mt-2 inline-block font-bold text-gold-deep hover:underline">{t.goOfferings} ↓</a>
              </div>
            )}
            {step === 1 && lesson.kind === "resource" && (
              <>
                <p className="rounded-2xl bg-sand/60 p-3 text-sm">{t.resourceNote}</p>
                <Bi a={a.common} label={t.lessonDescription} rows={3} value={lesson.description ?? { ar: "", en: "" }} onChange={(v) => onLesson({ description: v })} />
              </>
            )}

            {step === 2 && <MaterialsEditor items={mats} onChange={(m) => onLesson({ materials: m })} disabled={disabled} />}

            {step === 3 && (
              <div>
                <h4 className="mb-3 font-black text-navy">{t.reviewTitle}</h4>
                <ul className="space-y-2 text-sm">
                  {([
                    [t.checks.title, bothTitles],
                    [t.checks.content, contentOk],
                    ...(lesson.kind === "quiz" ? [[t.checks.quiz, issues.length === 0] as [string, boolean]] : []),
                    [`${t.checks.files} (${mats.length})`, mats.length > 0],
                    [t.checks.minutes, lesson.minutes > 0],
                  ] as [string, boolean][]).map(([label, ok]) => (
                    <li key={label} className="flex items-center gap-2"><span className={`chip ${ok ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{ok ? `✓ ${t.ok}` : `! ${t.missing}`}</span>{label}</li>
                  ))}
                </ul>
              </div>
            )}
          </fieldset>

          <div className="mt-5 flex items-center justify-between">
            <button type="button" className="btn btn-outline !py-2 text-sm" disabled={step === 0} onClick={() => onStep((step - 1) as Step)}>← {t.prev}</button>
            {step < 3
              ? <button type="button" className="btn btn-gold !py-2 text-sm" onClick={() => onStep((step + 1) as Step)}>{t.next} →</button>
              : <button type="button" className="btn btn-gold !py-2 text-sm" onClick={onToggle}>✓ {t.finish}</button>}
          </div>
        </div>
      )}
    </div>
  );
}
