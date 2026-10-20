"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { catalog, fileUrl } from "@/lib/api";
import { tr, type Dict } from "@/lib/i18n";
import type { Banner, BannerTheme, Locale } from "@/lib/types";

const THEME: Record<BannerTheme, string> = {
  navy: "bg-gradient-to-r from-navy to-navy-3 text-white",
  gold: "bg-gradient-to-r from-gold-light to-gold text-navy",
  teal: "bg-gradient-to-r from-teal to-sky text-navy",
  violet: "bg-gradient-to-r from-violet to-navy-3 text-white",
};

/** One slide. Also used by the admin preview. */
export function BannerSlide({ b, locale }: { b: Banner; locale: Locale }) {
  const label = tr(b.ctaLabel, locale);
  const external = !!b.linkUrl && /^https:/.test(b.linkUrl);
  const cta = b.linkUrl && label ? (
    external
      ? <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="btn mt-3 !bg-white !py-2 text-sm !text-navy hover:!bg-sand">{label} ↗</a>
      : <Link href={`/${locale}${b.linkUrl}`} className="btn mt-3 !bg-white !py-2 text-sm !text-navy hover:!bg-sand">{label}</Link>
  ) : null;
  return (
    <div className={`relative flex h-full items-center overflow-hidden ${THEME[b.theme]}`}>
      {b.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fileUrl(b.imageUrl)} alt="" className="absolute inset-y-0 end-0 h-full w-1/2 object-cover opacity-60 [mask-image:linear-gradient(to_left,black_40%,transparent)] rtl:[mask-image:linear-gradient(to_right,black_40%,transparent)]" />
      )}
      <div className="container-x relative py-5 ps-14 pe-14">
        <p className="text-lg font-black leading-snug sm:text-2xl">{tr(b.title, locale)}</p>
        {tr(b.subtitle, locale) && <p className="mt-1 max-w-2xl text-sm opacity-90 sm:text-base">{tr(b.subtitle, locale)}</p>}
        {cta}
      </div>
    </div>
  );
}

/** Announcement slider shown at the top of the home page. Renders nothing when there are no live banners. */
export function BannerSlider({ locale, t }: { locale: Locale; t: Dict }) {
  const [items, setItems] = useState<Banner[]>([]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const box = useRef<HTMLElement>(null);
  useEffect(() => { catalog.banners().then(setItems).catch(() => setItems([])); }, []);
  useEffect(() => { setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  useEffect(() => {
    if (items.length < 2 || paused || reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [items.length, paused, reduced]);
  if (items.length === 0) return null;
  const n = items.length, cur = Math.min(i, n - 1);
  const go = (k: number) => setI((k + n) % n);
  return (
    <section ref={box} aria-roledescription="carousel" aria-label={t.banner.label} className="relative h-36 sm:h-32"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {items.map((b, k) => (
        <div key={b.id} role="group" aria-roledescription="slide" aria-label={`${k + 1} / ${n}`} aria-hidden={k !== cur}
          className={`absolute inset-0 transition-opacity duration-500 ${k === cur ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          {k === cur ? <BannerSlide b={b} locale={locale} /> : <div className="h-full" />}
        </div>
      ))}
      {n > 1 && (
        <>
          <button type="button" aria-label={t.banner.prev} onClick={() => go(cur - 1)} className="absolute start-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-xl text-white hover:bg-black/40 rtl:rotate-180">‹</button>
          <button type="button" aria-label={t.banner.next} onClick={() => go(cur + 1)} className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-xl text-white hover:bg-black/40 rtl:rotate-180">›</button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
            {items.map((b, k) => <button key={b.id} type="button" aria-label={`${t.banner.goTo} ${k + 1}`} aria-current={k === cur} onClick={() => setI(k)} className={`h-2 rounded-full transition-all ${k === cur ? "w-6 bg-white" : "w-2 bg-white/50"}`} />)}
          </div>
        </>
      )}
    </section>
  );
}
