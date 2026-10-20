import { num, type Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** Clear course progress: state chip, percentage, bar with milestones, lessons count. */
export function Progress({ pct, done, total, locale, t, size = "md" }: { pct: number; done: number; total: number; locale: Locale; t: Dict; size?: "sm" | "md" }) {
  const state = pct >= 100 ? "completed" : pct > 0 ? "inProgress" : "notStarted";
  const tone = { completed: "bg-emerald-100 text-emerald-800", inProgress: "bg-gold/20 text-gold-deep", notStarted: "bg-sand text-navy/70" }[state];
  const fill = state === "completed" ? "bg-emerald-500" : "gold-bg";
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={`chip ${tone}`}>{state === "completed" ? "✓ " : ""}{t.prog[state]}</span>
        <span className={`font-black text-navy ${size === "sm" ? "text-sm" : "text-xl"}`} dir="ltr">{num(pct, locale)}%</span>
      </div>
      <div className={`relative mt-2 overflow-hidden rounded-full bg-navy/10 ${size === "sm" ? "h-2.5" : "h-3.5"}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.my.progress}>
        <div className={`h-full rounded-full transition-all duration-700 ${fill}`} style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }} />
        {[25, 50, 75].map((m) => <span key={m} className="absolute inset-y-0 w-px bg-white/70" style={{ insetInlineStart: `${m}%` }} aria-hidden="true" />)}
      </div>
      <p className="mt-1.5 text-xs text-mute">
        {t.prog.lessonsOf.replace("{done}", num(done, locale)).replace("{total}", num(total, locale))}
        {state === "inProgress" && ` · ${t.prog.toCert.replace("{n}", num(total - done, locale))}`}
      </p>
    </div>
  );
}
