"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { num, tr, type Dict } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import type { Course, Enrollment, Locale } from "@/lib/types";

export function Player({ course, locale, t }: { course: Course; locale: Locale; t: Dict }) {
  const { token, ready } = useAuth();
  const [enr, setEnr] = useState<Enrollment | null | undefined>(undefined);
  const lessons = course.modules.flatMap((m) => m.lessons);
  const [cur, setCur] = useState(lessons[0].id);
  useEffect(() => { if (token) userApi.enrollments(token).then((l) => setEnr(l.find((e) => e.courseSlug === course.slug) ?? null)).catch(() => setEnr(null)); }, [token, course.slug]);

  if (ready && !token) return <div className="container-x py-24 text-center"><Link className="btn btn-gold" href={`/${locale}/login?next=/${locale}/learn/${course.slug}`}>{t.my.needLogin}</Link></div>;
  if (enr === null) return <div className="container-x py-24 text-center"><p className="mb-4">{t.my.empty}</p><Link className="btn btn-gold" href={`/${locale}/courses/${course.slug}`}>{t.course.enroll}</Link></div>;
  if (!enr) return <div className="container-x py-24 text-center text-mute">{t.common.loading}</div>;

  const lesson = lessons.find((l) => l.id === cur)!;
  const done = enr.completedLessonIds.includes(cur);
  const mark = async () => { if (token) setEnr(await userApi.completeLesson(token, course.slug, cur)); };
  return (
    <div className="container-x grid gap-6 py-8 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl bg-navy p-8 text-center text-white">
          <p className="max-w-md text-white/70">{lesson.kind === "live" ? t.learn.liveRoomPlaceholder : t.learn.videoPlaceholder}</p>
        </div>
        <h1 className="mt-5 text-2xl font-black text-navy">{tr(lesson.title, locale)}</h1>
        <button onClick={mark} disabled={done} className="btn btn-gold mt-4">{done ? `✓ ${t.learn.done}` : t.learn.markDone}</button>
        {enr.certificateCode && <p className="mt-4 rounded-2xl bg-sand p-4 font-medium">🎓 {t.learn.complete} <b dir="ltr">{enr.certificateCode}</b></p>}
      </div>
      <aside className="card h-fit overflow-hidden">
        <div className="border-b border-navy/10 p-4"><b className="text-navy">{t.learn.lessonList}</b><div className="mt-2 h-2 overflow-hidden rounded-full bg-sand"><div className="gold-bg h-full" style={{ width: `${enr.progressPct}%` }} /></div></div>
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
