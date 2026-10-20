"use client";
import type { Quiz, QuizQuestion } from "@/lib/types";
import { Bi } from "./Bi";
import { useAdmin } from "./AdminShell";

const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 7)}`;
const E = { ar: "", en: "" };
export const newQuiz = (): Quiz => ({ passPct: 70, questions: [] });
const newQuestion = (): QuizQuestion => ({ id: uid("q"), prompt: { ...E }, options: [{ id: uid("o"), text: { ...E } }, { id: uid("o"), text: { ...E } }], correctId: "" });

/** What is still missing in a quiz (dictionary keys of `ed.quiz`). Empty = ready to submit. */
export function quizIssues(q: Quiz | undefined): ("empty" | "needPrompt" | "needTwo" | "needCorrect")[] {
  if (!q || q.questions.length === 0) return ["empty"];
  const out = new Set<"needPrompt" | "needTwo" | "needCorrect">();
  for (const x of q.questions) {
    if (!x.prompt.ar.trim() && !x.prompt.en.trim()) out.add("needPrompt");
    const filled = x.options.filter((o) => o.text.ar.trim() || o.text.en.trim());
    if (filled.length < 2) out.add("needTwo");
    if (!x.correctId || !filled.some((o) => o.id === x.correctId)) out.add("needCorrect");
  }
  return [...out];
}

/** Build a quiz for a lesson: questions with 2 to 6 options, the correct one marked, an optional explanation, and the pass mark. */
export function QuizDesigner({ quiz, onChange, disabled = false }: { quiz: Quiz | undefined; onChange: (q: Quiz) => void; disabled?: boolean }) {
  const { a } = useAdmin();
  const t = a.ed.quiz;
  const q = quiz ?? newQuiz();
  const setQ = (i: number, patch: Partial<QuizQuestion>) => onChange({ ...q, questions: q.questions.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const issues = quizIssues(quiz);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block text-sm font-bold text-navy">{t.pass}
          <input type="number" min={1} max={100} className="input mt-1.5 !w-28 !py-2" dir="ltr" disabled={disabled} value={q.passPct} onChange={(e) => onChange({ ...q, passPct: Math.min(100, Math.max(1, +e.target.value || 70)) })} />
        </label>
        <span className={`chip ${issues.length === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {issues.length === 0 ? `✓ ${t.ready} · ${q.questions.length} ${t.questionsN}` : `! ${t.incomplete}`}
        </span>
      </div>
      {q.questions.length === 0 && <p className="rounded-xl bg-sand/60 p-3 text-sm text-mute">{t.empty}</p>}
      {q.questions.map((x, i) => {
        const bad = quizIssues({ passPct: 1, questions: [x] }).filter((k) => k !== "empty");
        return (
          <div key={x.id} className={`rounded-2xl border p-4 ${bad.length ? "border-amber-300 bg-amber-50/40" : "border-navy/10 bg-white"}`}>
            <div className="mb-3 flex items-center justify-between">
              <b className="text-sm text-navy">{t.question} {i + 1}</b>
              <button type="button" className="text-sm font-bold text-red-600 hover:underline" disabled={disabled} onClick={() => onChange({ ...q, questions: q.questions.filter((_, j) => j !== i) })}>{t.removeQuestion}</button>
            </div>
            <Bi a={a.common} label={t.question} rows={2} value={x.prompt} onChange={(v) => setQ(i, { prompt: v })} />
            <fieldset className="mt-3" disabled={disabled}>
              <legend className="mb-1.5 text-sm font-bold text-navy">{t.option} · {t.correct}</legend>
              <div className="space-y-2">
                {x.options.map((o, oi) => (
                  <div key={o.id} className="flex items-start gap-2">
                    <input type="radio" name={`correct-${x.id}`} className="mt-3.5 accent-[#c49c3e]" aria-label={`${t.correct}: ${t.option} ${oi + 1}`} checked={x.correctId === o.id} onChange={() => setQ(i, { correctId: o.id })} />
                    <div className="grid flex-1 gap-2 md:grid-cols-2">
                      <input className="input !py-2" dir="rtl" lang="ar" placeholder={`${t.option} ${oi + 1} (${a.common.arabic})`} value={o.text.ar} onChange={(e) => setQ(i, { options: x.options.map((p) => (p.id === o.id ? { ...p, text: { ...p.text, ar: e.target.value } } : p)) })} />
                      <input className="input !py-2" dir="ltr" lang="en" placeholder={`${t.option} ${oi + 1} (${a.common.english})`} value={o.text.en} onChange={(e) => setQ(i, { options: x.options.map((p) => (p.id === o.id ? { ...p, text: { ...p.text, en: e.target.value } } : p)) })} />
                    </div>
                    <button type="button" className="mt-2 px-2 text-red-600 disabled:opacity-30" disabled={disabled || x.options.length <= 2} aria-label={a.common.remove} onClick={() => setQ(i, { options: x.options.filter((p) => p.id !== o.id), correctId: x.correctId === o.id ? "" : x.correctId })}>✕</button>
                  </div>
                ))}
              </div>
              {x.options.length < 6 && <button type="button" className="mt-2 text-sm font-bold text-gold-deep hover:underline" onClick={() => setQ(i, { options: [...x.options, { id: uid("o"), text: { ...E } }] })}>+ {t.addOption}</button>}
            </fieldset>
            <div className="mt-3"><Bi a={a.common} label={t.explanation} rows={2} value={x.explanation ?? E} onChange={(v) => setQ(i, { explanation: v })} /></div>
            {bad.length > 0 && <p className="mt-2 text-xs font-bold text-amber-800">{bad.map((k) => t[k]).join(" · ")}</p>}
          </div>
        );
      })}
      <button type="button" className="btn btn-outline" disabled={disabled || q.questions.length >= 50} onClick={() => onChange({ ...q, questions: [...q.questions, newQuestion()] })}>+ {t.addQuestion}</button>
      <p className="text-xs text-mute">{t.hintGrading}</p>
    </div>
  );
}
