"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { dateOnly, num, tr, type Dict } from "@/lib/i18n";
import { ACADEMY_LEGAL, DRAFT_CONTENT, FOUNDER } from "@/lib/placeholders";
import { useAuth } from "@/lib/store";
import type { Course, Enrollment, Locale, Mentor } from "@/lib/types";
import { Signature } from "./Signature";

/** Round academy stamp: text on a circle, flower in the middle. Ink look, slightly rotated. */
function Stamp({ top, bottom }: { top: string; bottom: string }) {
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-12" role="img" aria-label="Academy stamp">
      <defs>
        <path id="stampTop" d="M 20 75 A 55 55 0 0 1 130 75" />
        <path id="stampBot" d="M 17 75 A 58 58 0 0 0 133 75" />
      </defs>
      <g fill="none" stroke="#1d3a8a" strokeOpacity=".85">
        <circle cx="75" cy="75" r="70" strokeWidth="3" />
        <circle cx="75" cy="75" r="64" strokeWidth="1" />
        <circle cx="75" cy="75" r="38" strokeWidth="1.5" />
      </g>
      <g fill="#1d3a8a" fillOpacity=".85" fontFamily="Roboto, Tajawal, sans-serif" fontWeight="700" fontSize="8.5" letterSpacing="0.6">
        <text><textPath href="#stampTop" startOffset="50%" textAnchor="middle">{top}</textPath></text>
        <text><textPath href="#stampBot" startOffset="50%" textAnchor="middle" dominantBaseline="hanging">{bottom}</textPath></text>
      </g>
      <image href="/brand/gpmf-flower-256.png" x="49" y="49" width="52" height="52" opacity=".8" />
      
    </svg>
  );
}

export function CertificateView({ locale, t, code, courses, mentors }: { locale: Locale; t: Dict; code: string; courses: Course[]; mentors: Mentor[] }) {
  const { token, user, ready } = useAuth();
  const [enr, setEnr] = useState<Enrollment | null | undefined>(undefined);
  useEffect(() => { if (token) userApi.enrollments(token).then((l) => setEnr(l.find((e) => e.certificateCode === code) ?? null)).catch(() => setEnr(null)); }, [token, code]);

  if (ready && !token) return <div className="container-x py-24 text-center"><Link className="btn btn-gold" href={`/${locale}/login?next=/${locale}/certificate/${code}`}>{t.cert.needLogin}</Link></div>;
  if (enr === null) return <div className="container-x py-24 text-center"><p className="mb-4 font-bold text-navy">{t.cert.notFound}</p><Link className="btn btn-navy" href={`/${locale}/my-courses`}>{t.cert.back}</Link></div>;
  if (!enr || !user) return <div className="container-x py-24 text-center text-mute">{t.common.loading}</div>;

  const course = courses.find((c) => c.slug === enr.courseSlug)!;
  const mentor = mentors.find((m) => m.id === course.mentorId)!;
  const issued = enr.completedAt ?? enr.enrolledAt;
  return (
    <div className="container-x py-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/${locale}/my-courses`} className="text-sm font-bold text-gold-deep hover:underline">← {t.cert.back}</Link>
        <button className="btn btn-gold" onClick={() => window.print()}>🖨 {t.cert.print}</button>
      </div>
      <div className="overflow-x-auto pb-4">
        <article id="certificate" className="relative mx-auto aspect-[1.414/1] w-[1000px] max-w-none overflow-hidden bg-[#fffdf7] p-10 text-navy shadow-2xl ring-1 ring-navy/10" aria-label={t.cert.title}>
          <div className="pointer-events-none absolute inset-4 border-[3px] border-gold" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-7 border border-gold/60" aria-hidden="true" />
          <img src="/brand/gpmf-flower.png" alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-[.06]" />
          <div className="relative flex h-full flex-col items-center px-10 pb-2 pt-6 text-center">
            <div className="flex items-center gap-3"><img src="/favicon-64.png" alt="" width={48} height={48} /><span className="text-xl font-black gold-text">{t.cert.academy}</span></div>
            <h1 className="mt-4 text-5xl font-black tracking-wide text-navy">{t.cert.title}</h1>
            <div className="mt-2 h-1 w-40 rounded-full gold-bg" />
            <p className="mt-6 text-lg text-navy/70">{t.cert.certifies}</p>
            <p className="mt-2 border-b-2 border-gold/50 px-10 pb-1 text-5xl font-black text-navy">{user.fullName}</p>
            <p className="mt-5 text-lg text-navy/70">{t.cert.completed}</p>
            <p className="mt-2 max-w-3xl text-3xl font-black leading-snug text-gold-deep">{tr(course.title, locale)}</p>
            <p className="mt-3 text-base text-navy/70">{t.cert.hours.replace("{h}", num(course.hours, locale))}{course.cpdPoints ? ` · ${t.cert.cpd.replace("{n}", num(course.cpdPoints, locale))}` : ""}</p>
            <div className="mt-auto grid w-full grid-cols-3 items-end gap-6 pt-6">
              <div className="flex flex-col items-center">
                <Signature label={tr(mentor.name, locale)} name={mentor.slug} image={null} />
                <div className="mt-1 w-48 border-t border-navy/40 pt-1 text-sm"><b>{tr(mentor.name, locale)}</b><br /><span className="text-xs text-mute">{t.cert.mentor}</span></div>
              </div>
              <div className="flex flex-col items-center">
                <Stamp top={t.cert.stampTop} bottom={t.cert.stampBottom} />
                <p className="text-xs text-mute">{t.cert.issued}: <b className="text-navy">{dateOnly(issued, locale)}</b></p>
              </div>
              <div className="flex flex-col items-center">
                <Signature label={tr(FOUNDER.name, locale)} name={FOUNDER.name.en} image={FOUNDER.signatureImage} />
                <div className="mt-1 w-48 border-t border-navy/40 pt-1 text-sm"><b>{tr(FOUNDER.name, locale)}</b><br /><span className="text-xs text-mute">{t.cert.director}</span></div>
              </div>
            </div>
            <p className="mt-4 text-xs text-mute">{t.cert.code}: <b className="text-navy" dir="ltr">{enr.certificateCode}</b> · {t.legal.cr} <span dir="ltr">{ACADEMY_LEGAL.crNumber}</span> · {t.cert.verify}</p>
            {DRAFT_CONTENT && <p className="no-print mt-1 text-[11px] text-gold-deep">{t.cert.sigPlaceholder}</p>}
          </div>
        </article>
      </div>
    </div>
  );
}
