import type { ReactNode } from "react";

export const PageTitle = ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-black text-navy">{children}</h1><div className="flex gap-2">{actions}</div></div>
);
export const Field = ({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) => (
  <label className={`block text-sm font-bold text-navy ${className}`}><span className="mb-1.5 block">{label}</span>{children}{hint && <span className="mt-1 block text-xs font-normal text-mute">{hint}</span>}</label>
);
export const Panel = ({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) => (
  <section className={`card p-5 ${className}`}>{title && <h2 className="mb-4 text-lg font-black text-navy">{title}</h2>}{children}</section>
);
export const Table = ({ head, children }: { head: string[]; children: ReactNode }) => (
  <div className="card overflow-x-auto"><table className="w-full text-start text-sm"><thead className="bg-sand/70 text-xs font-bold text-navy"><tr>{head.map((h, i) => <th key={i} className="px-4 py-3 text-start">{h}</th>)}</tr></thead><tbody className="divide-y divide-navy/5">{children}</tbody></table></div>
);
export const Badge = ({ children, tone = "sand" }: { children: ReactNode; tone?: "sand" | "green" | "red" | "gold" }) => (
  <span className={`chip ${{ sand: "bg-sand text-navy", green: "bg-emerald-100 text-emerald-800", red: "bg-red-100 text-red-700", gold: "bg-gold/20 text-gold-deep" }[tone]}`}>{children}</span>
);
