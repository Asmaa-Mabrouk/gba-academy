"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, byCode, countryName } from "@/lib/countries";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** Country code picker with flags + national number input. Controlled. */
export function PhoneInput({ id, country, value, onCountry, onValue, onBlur, invalid, describedBy, locale, t }: {
  id: string; country: string; value: string; onCountry(c: string): void; onValue(v: string): void; onBlur?(): void;
  invalid?: boolean; describedBy?: string; locale: Locale; t: Dict;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const cur = byCode(country);
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return COUNTRIES.filter((c) => !s || countryName(c.code, locale).toLowerCase().includes(s) || c.dial.includes(s) || c.code.toLowerCase() === s);
  }, [q, locale]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const pick = (c: string) => { onCountry(c); setOpen(false); setQ(""); };

  return (
    <div ref={root} className="relative" dir="ltr">
      <div className={`flex items-stretch rounded-[.85rem] border-[1.5px] bg-white transition focus-within:border-gold focus-within:shadow-[0_0_0_4px_rgb(196_156_62/.2)] ${invalid ? "!border-red-600 bg-red-50" : "border-navy/15"}`}>
        <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-label={t.auth.country}
          onClick={() => { setOpen(!open); setHi(0); }}
          className="flex shrink-0 items-center gap-2 rounded-s-[.85rem] border-e border-navy/10 px-3 hover:bg-sand">
          <span className={`fi fi-${cur.code.toLowerCase()} rounded-sm`} style={{ width: 24, height: 18, backgroundSize: "cover" }} aria-hidden="true" />
          <span className="text-sm font-bold text-navy">{cur.dial}</span>
          <span className="text-[10px] text-mute" aria-hidden="true">▾</span>
        </button>
        <input id={id} type="tel" inputMode="numeric" autoComplete="tel" placeholder={cur.code === "SA" ? "5XXXXXXXX" : ""} value={value}
          aria-invalid={invalid} aria-describedby={describedBy} onBlur={onBlur}
          onChange={(e) => onValue(e.target.value.replace(/[^\d\s]/g, "").slice(0, 16))}
          className="min-w-0 flex-1 rounded-e-[.85rem] bg-transparent px-3 py-[.8rem] outline-none" />
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-2xl" dir={locale === "ar" ? "rtl" : "ltr"}>
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setHi(0); }} placeholder={t.auth.searchCountry} aria-label={t.auth.searchCountry}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, items.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); if (items[hi]) pick(items[hi].code); }
              else if (e.key === "Escape") setOpen(false);
            }}
            className="w-full border-b border-navy/10 px-4 py-3 text-sm outline-none" />
          <ul id={listId} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {items.map((c, i) => (
              <li key={c.code} role="option" aria-selected={c.code === country}>
                <button type="button" onClick={() => pick(c.code)} onMouseEnter={() => setHi(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm ${i === hi ? "bg-sand" : ""} ${c.code === country ? "font-bold" : ""}`}>
                  <span className={`fi fi-${c.code.toLowerCase()} rounded-sm`} style={{ width: 24, height: 18, backgroundSize: "cover" }} aria-hidden="true" />
                  <span className="flex-1 truncate">{countryName(c.code, locale)}</span>
                  <span className="text-mute" dir="ltr">{c.dial}</span>
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="px-4 py-3 text-sm text-mute">{t.auth.noCountry}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
