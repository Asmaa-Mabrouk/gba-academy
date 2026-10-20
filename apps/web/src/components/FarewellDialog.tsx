"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { GpmfSpiral } from "./GpmfSpiral";

/** "See you soon" popup shown after logging out. Dismiss with the button, Esc, a click outside, or wait. */
export function FarewellDialog({ name, locale, t, onClose }: { name: string; locale: Locale; t: Dict; onClose(): void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    const timer = setTimeout(onClose, 9000);
    return () => { document.removeEventListener("keydown", key); clearTimeout(timer); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-navy/30 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="farewell-title" className="farewell-pop card relative w-full max-w-md overflow-hidden p-8 text-center shadow-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 band opacity-90" aria-hidden="true" />
        <button ref={closeRef} onClick={onClose} aria-label={t.farewell.close} className="absolute end-4 top-4 rounded-full p-2 text-mute hover:bg-navy/5 hover:text-navy">✕</button>
        <div className="relative mx-auto mt-2 h-28 w-28">
          <GpmfSpiral size={112} />
          <span className="farewell-wave absolute -bottom-2 -end-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-lg ring-2 ring-gold/50" aria-hidden="true">👋</span>
        </div>
        <h2 id="farewell-title" className="relative mt-6 text-2xl font-black text-navy">{t.farewell.title.replace("{name}", name)}</h2>
        <p className="relative mt-2 leading-7 text-navy/70">{t.farewell.text}</p>
        <p className="relative mt-4 rounded-2xl border border-gold/30 bg-gold/10 p-3 text-sm font-medium text-navy">✨ {t.encourage[new Date().getDate() % t.encourage.length]}</p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}`} onClick={onClose} className="btn btn-outline">{t.farewell.home}</Link>
          <Link href={`/${locale}/login`} onClick={onClose} className="btn btn-gold">{t.farewell.again}</Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-navy/5" aria-hidden="true"><div className="farewell-timer gold-bg h-full" /></div>
      </div>
    </div>
  );
}
