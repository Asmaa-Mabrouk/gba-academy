"use client";
import type { Bilingual } from "@/lib/types";

/** Two inputs for one bilingual value: Arabic (RTL) and English (LTR). */
export function Bi({ label, value, onChange, rows, a }: { label: string; value: Bilingual; onChange: (v: Bilingual) => void; rows?: number; a: { arabic: string; english: string } }) {
  const Tag = rows ? "textarea" : "input";
  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-navy">{label}</span>
      <div className="grid gap-2 md:grid-cols-2">
        <Tag className="input" rows={rows} dir="rtl" lang="ar" placeholder={a.arabic} value={value.ar} onChange={(e) => onChange({ ...value, ar: e.target.value })} />
        <Tag className="input" rows={rows} dir="ltr" lang="en" placeholder={a.english} value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} />
      </div>
    </div>
  );
}
