"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { catalog, userApi } from "@/lib/api";
import { dateOnly, dateTime, num, tr, type Dict } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import type { Course, Enrollment, Locale } from "@/lib/types";
import { CourseCover } from "./CourseCover";

export function MyCourses({ locale, t }: { locale: Locale; t: Dict }) {
  const { token, ready, user } = useAuth();
  const [enr, setEnr] = useState<Enrollment[] | null>(null);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [tab, setTab] = useState<"active" | "upcoming" | "completed">("active");
  useEffect(() => {
    catalog.courses().then((cs) => setCourses(Object.fromEntries(cs.map((c) => [c.slug, c]))));
    if (token) userApi.enrollments(token).then(setEnr).catch(() => setEnr([]));
  }, [token]);

  if (ready && !user)
    return <div className="container-x py-24 text-center"><p className="text-xl font-bold text-navy">{t.my.needLogin}</p><Link className="btn btn-gold mt-6" href={`/${locale}/login?next=/${locale}/my-courses`}>{t.nav.login}</Link></div>;

  const list = (enr ?? []).filter((e) => (tab === "completed" ? e.progressPct === 100 : tab === "upcoming" ? !!e.nextSession && e.progressPct < 100 : e.progressPct < 100));
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-black text-navy">{t.my.title}</h1>
      <p className="text-mute">{t.my.subtitle}</p>
      <div className="mt-6 flex gap-2" role="tablist">
        {(Object.keys(t.my.tabs) as (keyof typeof t.my.tabs)[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === k ? "bg-navy text-gold-light" : "bg-sand text-navy"}`}>{t.my.tabs[k]}</button>
        ))}
      </div>
      {enr && list.length === 0 ? (
        <div className="card mt-8 p-12 text-center text-mute">{t.my.empty}<div><Link className="btn btn-gold mt-5" href={`/${locale}/courses`}>{t.cart.explore}</Link></div></div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {list.map((e) => {
            const c = courses[e.courseSlug];
            if (!c) return null;
            return (
              <article key={e.id} className="card flex overflow-hidden">
                <CourseCover slug={c.slug} audience={c.audience} className="hidden w-40 shrink-0 object-cover sm:block" />
                <div className="flex-1 p-5">
                  <span className="chip bg-sand text-navy">{t.modes[e.mode]}</span>
                  <h2 className="mt-2 font-bold text-navy">{tr(c.title, locale)}</h2>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand"><div className="gold-bg h-full rounded-full" style={{ width: `${e.progressPct}%` }} /></div>
                  <p className="mt-1 text-xs text-mute">{t.my.progress}: {num(e.progressPct, locale)}%{e.expiresAt ? ` · ${t.my.expires} ${dateOnly(e.expiresAt, locale)}` : ""}</p>
                  {e.nextSession && <p className="mt-2 text-sm">{t.my.nextSession}: <b>{dateTime(e.nextSession.startsAt, locale)}</b></p>}
                  {e.certificateCode && <p className="mt-2 text-sm">🎓 {t.my.certificateCode}: <b dir="ltr">{e.certificateCode}</b></p>}
                  <Link href={`/${locale}/learn/${c.slug}`} className="btn btn-navy mt-4 !py-2 text-sm">{t.my.continue}</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
