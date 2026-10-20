"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { catalog } from "@/lib/api";
import { money, tr, type Dict } from "@/lib/i18n";
import { useAuth, useCart } from "@/lib/store";
import { useToast } from "@/lib/toast";
import { VAT_RATE, type Course, type Locale } from "@/lib/types";
import { CourseCover } from "./CourseCover";

export function Summary({ total, locale, t }: { total: number; locale: Locale; t: Dict }) {
  const net = Math.round(total / (1 + VAT_RATE));
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-mute">{t.cart.subtotal}</dt><dd>{money(net, locale)}</dd></div>
      <div className="flex justify-between"><dt className="text-mute">{t.cart.vat}</dt><dd>{money(total - net, locale)}</dd></div>
      <div className="flex justify-between border-t border-navy/10 pt-3 text-lg font-black text-navy"><dt>{t.cart.total}</dt><dd>{money(total, locale)}</dd></div>
    </dl>
  );
}

export function CartView({ locale, t }: { locale: Locale; t: Dict }) {
  const { lines, remove: rm } = useCart();
  const toast = useToast();
  const remove = (id: string) => { rm(id); toast.info(t.toast.removed); };
  const { user, ready } = useAuth();
  const [courses, setCourses] = useState<Record<string, Course>>({});
  useEffect(() => { catalog.courses().then((cs) => setCourses(Object.fromEntries(cs.map((c) => [c.slug, c])))); }, []);
  const total = lines.reduce((s, l) => s + l.priceHalalas, 0);

  if (lines.length === 0)
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-3xl font-black text-navy">{t.cart.empty}</h1>
        <p className="mt-2 text-mute">{t.cart.emptyHint}</p>
        <Link href={`/${locale}/courses`} className="btn btn-gold mt-6">{t.cart.explore}</Link>
      </div>
    );
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-black text-navy">{t.cart.title}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {lines.map((l) => {
            const c = courses[l.courseSlug];
            return (
              <li key={l.offeringId} className="card flex gap-4 p-4">
                {c && <CourseCover slug={c.slug} audience={c.audience} className="h-24 w-36 shrink-0 rounded-xl" />}
                <div className="flex-1">
                  <p className="font-bold text-navy">{c ? tr(c.title, locale) : l.courseSlug}</p>
                  <span className="chip mt-1 bg-sand text-navy">{t.modes[l.mode]}</span>
                  <button onClick={() => remove(l.offeringId)} className="mt-2 block text-sm text-red-600 hover:underline">{t.cart.remove}</button>
                </div>
                <b className="text-navy">{money(l.priceHalalas, locale)}</b>
              </li>
            );
          })}
        </ul>
        <aside className="card h-fit space-y-4 p-6">
          <Summary total={total} locale={locale} t={t} />
          {ready && user ? (
            <Link href={`/${locale}/checkout`} className="btn btn-gold w-full">{t.cart.checkout}</Link>
          ) : (
            <Link href={`/${locale}/login?next=/${locale}/checkout`} className="btn btn-navy w-full">{t.cart.needLogin}</Link>
          )}
          <p className="text-center text-xs text-mute">{t.common.vatIncluded}</p>
        </aside>
      </div>
    </div>
  );
}
