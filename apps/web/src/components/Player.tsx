"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { num, tr, type Dict } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { Progress } from "./Progress";
import type { Course, Enrollment, Locale } from "@/lib/types";

export function Player({ course, locale, t }: { course: Course; locale: Locale; t: Dict }) {
  const { token, ready } = useAuth();
  const toast = useToast();
  const [enr, setEnr] = useState<Enrollment | null | undefined>(undefined);
  const lessons = course.modules.flatMap((m) => m.lessons);
  const [cur, setCur] = useState(lessons[0].id);
  useEffect(() => { if (token) userApi.enrollments(token).then((l) => setEnr(l.find((e) => e.courseSlug === course.slug) ?? null)).catch(() => setEnr(null)); }, [token, course.slug]);

  if (ready && !token) return <div className="container-x py-24 text-center"><Link className="btn btn-gold" href={`/${locale}/login?next=/${locale}/learn/${course.slug}`}>{t.my.needLogin}</Link></div>;
  if (enr === null) return <div className="container-x py-24 text-center"><p className="mb-4">{t.my.empty}</p><Link className="btn btn-gold" href={`/${locale}/courses/${course.slug}`}>{t.course.enroll}</Link></div>;
  if (!enr) return <div className="container-x py-24 text-center text-mute">{t.common.loading}</div>;

  const lesson = lessons.find((l) => l.id === cur)!;
  const done = enr.completedLessonIds.includes(cur);
  const idx = lessons.findIndex((l) => l.id === cur);
  const mark = async () => {
    if (!token) return;
    try {
      const e = await userApi.completeLesson(token, course.slug, cur);
      setEnr(e);
      if (e.progressPct === 100 && !enr.certificateCode) toast.success(t.toast.courseDone); else toast.success(t.toast.lessonDone);
      const nxt = lessons.find((l) => !e.completedLessonIds.includes(l.id) && lessons.indexOf(l) > idx) ?? lessons.find((l) => !e.completedLessonIds.includes(l.id));
      if (nxt) setCur(nxt.id);
    } catch { toast.error(t.toast.network); }
  };
  return (
    <div className="container-x grid gap-6 py-8 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl bg-navy p-8 text-center text-white">
          <p className="max-w-md text-white/70">{lesson.kind === "live" ? t.learn.liveRoomPlaceholder : t.learn.videoPlaceholder}</p>
        </div>
        <p className="mt-5 text-sm font-bold text-gold-deep">{t.prog.lessonN.replace("{n}", num(idx + 1, locale)).replace("{total}", num(lessons.length, locale))}</p>
        <h1 className="mt-1 text-2xl font-black text-navy">{tr(lesson.title, locale)}</h1>
        <button onClick={mark} disabled={done} className="btn btn-gold mt-4">{done ? `✓ ${t.learn.done}` : t.learn.markDone}</button>
        {enr.certificateCode && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-medium text-emerald-900">🎓 {t.learn.complete} <b dir="ltr">{enr.certificateCode}</b></p><Link className="btn btn-navy !py-2 text-sm" href={`/${locale}/certificate/${enr.certificateCode}`}>{t.cert.view}</Link></div>}
      </div>
      <aside className="card h-fit overflow-hidden">
        <div className="space-y-3 border-b border-navy/10 p-5"><b className="text-navy">{t.learn.lessonList}</b><Progress pct={enr.progressPct} done={enr.completedLessonIds.length} total={lessons.length} locale={locale} t={t} /></div>
        {course.modules.map((m) => (
          <div key={m.id}>
            <p className="bg-sand/70 px-4 py-2 text-xs font-bold text-navy">{tr(m.title, locale)}</p>
            {m.lessons.map((l) => (
              <button key={l.id} onClick={() => setCur(l.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-start text-sm ${l.id === cur ? "bg-gold/15 font-bold" : "hover:bg-sand/50"}`}>
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
