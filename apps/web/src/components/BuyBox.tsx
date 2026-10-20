"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dateTime, money, num, tr, type Dict } from "@/lib/i18n";
import { useCart } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { Course, Locale } from "@/lib/types";

export function BuyBox({ course, locale, t }: { course: Course; locale: Locale; t: Dict }) {
  const [sel, setSel] = useState(course.offerings[0].id);
  const cart = useCart();
  const router = useRouter();
  const toast = useToast();
  const o = course.offerings.find((x) => x.id === sel)!;
  const inCart = cart.has(o.id);
  const add = () => {
    const prev = cart.lines.find((l) => l.courseSlug === course.slug && l.offeringId !== o.id);
    cart.add({ offeringId: o.id, courseSlug: course.slug, mode: o.mode, priceHalalas: o.priceHalalas });
    if (prev) toast.warning(t.toast.replaced); else toast.success(t.toast.added);
  };
  const hint = { recorded: t.modes.recordedHint, live: t.modes.liveHint, blended: t.modes.blendedHint };
  return (
    <div className="card overflow-hidden shadow-xl">
      <div className="p-6">
        <p className="mb-3 text-sm font-bold text-navy">{t.course.chooseFormat}</p>
        <div className="space-y-2" role="radiogroup">
          {course.offerings.map((x) => (
            <button key={x.id} role="radio" aria-checked={x.id === sel} onClick={() => setSel(x.id)}
              className={`flex w-full items-center justify-between rounded-2xl border-2 p-3.5 text-start transition ${x.id === sel ? "border-gold bg-sand" : "border-navy/10 hover:border-navy/30"}`}>
              <span><span className="block font-bold text-navy">{t.modes[x.mode]}</span><span className="block text-xs text-mute">{hint[x.mode]}</span></span>
              <span className="whitespace-nowrap font-extrabold text-navy">{money(x.priceHalalas, locale)}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-4xl font-black text-navy">{money(o.priceHalalas, locale)}</span>
          {o.compareAtHalalas && <s className="text-mute">{money(o.compareAtHalalas, locale)}</s>}
        </div>
        {o.priceHalalas > 0 && <p className="text-xs text-mute">{t.common.vatIncluded}</p>}
        <div className="mt-5 grid gap-2">
          {inCart ? (
            <Link href={`/${locale}/cart`} className="btn btn-navy">{t.course.goToCart}</Link>
          ) : (
            <>
              <button className="btn btn-gold" onClick={() => { add(); router.push(`/${locale}/cart`); }}>{t.course.enroll}</button>
              <button className="btn btn-outline" onClick={add}>{t.course.addToCart}</button>
            </>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-mute">{t.course.refundNote}</p>
      </div>
      <div className="space-y-2 border-t border-navy/10 bg-sand/60 p-6 text-sm">
        <p className="font-bold text-navy">{t.course.includes}</p>
        <p>▸ {num(course.hours, locale)} {t.common.hours}</p>
        {o.accessDays && <p>▸ {t.course.accessDays} {num(o.accessDays, locale)} {t.course.days}</p>}
        {course.certificate && <p>▸ {t.course.certificateIncluded}</p>}
        {course.cpdPoints && <p>▸ {num(course.cpdPoints, locale)} {t.course.cpd}</p>}
        {course.ageRange && <p>▸ {t.course.ageRange}: {course.ageRange}</p>}
        {course.audience === "kids" && <p className="text-xs text-mute">{t.course.guardianNote}</p>}
      </div>
      {o.capacity ? (
        <div className="border-t border-navy/10 p-6 text-sm">
          <div className="mb-1 flex justify-between font-bold text-navy"><span>{num(o.enrolled ?? 0, locale)} {t.course.cohortOf} {num(o.capacity, locale)} {t.course.cohortBooked}</span>{(o.enrolled ?? 0) >= o.capacity && <span className="text-red-600">{t.course.cohortFull}</span>}</div>
          <div className="h-2 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuemin={0} aria-valuemax={o.capacity} aria-valuenow={o.enrolled ?? 0}><div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, ((o.enrolled ?? 0) / o.capacity) * 100)}%` }} /></div>
          {o.minLearners ? <p className="mt-2 text-xs text-mute">{(o.enrolled ?? 0) >= o.minLearners ? t.course.cohortRunning : t.course.cohortRunsAt.replace("{n}", num(o.minLearners, locale))}</p> : null}
        </div>
      ) : null}
      {o.sessions.length > 0 && (
        <div className="border-t border-navy/10 p-6">
          <p className="mb-3 font-bold text-navy">{t.course.nextSessions}{o.cohortLabel ? ` · ${tr(o.cohortLabel, locale)}` : ""}</p>
          <ul className="space-y-2 text-sm">
            {o.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-sand/70 px-3 py-2">
                <span>{dateTime(s.startsAt, locale)}</span>
                <span className={s.seatsLeft <= 5 ? "font-bold text-red-600" : "text-mute"}>{num(s.seatsLeft, locale)} {t.common.seatsLeft}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
