"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import { isMock } from "@/lib/api";
import { getAdminDict, type AdminDict } from "@/lib/dict/admin";
import { useAuth } from "@/lib/store";
import type { Locale } from "@/lib/types";

interface Ctx { locale: Locale; a: AdminDict; token: string }
export const AdminCtx = createContext<Ctx | null>(null);
export const useAdmin = () => { const c = useContext(AdminCtx); if (!c) throw new Error("AdminShell missing"); return c; };

/** Guards the /admin area and draws its sidebar. Mentor portal can reuse this pattern with role "mentor". */
export function AdminShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const a = getAdminDict(locale);
  const { user, token, ready } = useAuth();
  const path = usePathname() ?? "";
  const L = (p: string) => `/${locale}/admin${p}`;

  if (!ready) return <div className="container-x py-24 text-center text-mute">{a.common.loading}</div>;
  if (!user || !token || !user.roles.includes("admin"))
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-2xl font-black text-navy">{a.common.noAccess}</h1>
        <p className="mt-2 text-mute">{a.common.noAccessText}</p>
        <Link href={`/${locale}/login?next=/${locale}/admin`} className="btn btn-gold mt-6">{locale === "ar" ? "تسجيل الدخول" : "Log in"}</Link>
      </div>
    );

  const items = [
    ["", a.nav.dashboard, "▦"], ["/courses", a.nav.courses, "▤"], ["/mentors", a.nav.mentors, "☺"],
    ["/orders", a.nav.orders, "$"], ["/promos", a.nav.promos, "%"], ["/users", a.nav.users, "☰"], ["/reviews", a.nav.reviews, "★"],
  ] as const;
  const active = (p: string) => (p === "" ? path === `/${locale}/admin` : path.startsWith(L(p)));

  return (
    <AdminCtx.Provider value={{ locale, a, token }}>
      <div className="container-x grid grid-cols-1 gap-6 py-8 lg:grid-cols-[230px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-gold-deep">{a.title}</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={a.title}>
            {items.map(([p, label, icon]) => (
              <Link key={p} href={L(p)} className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold transition ${active(p) ? "bg-navy text-gold-light" : "text-navy/80 hover:bg-sand"}`}>
                <span aria-hidden className="w-5 text-center">{icon}</span>{label}
              </Link>
            ))}
            <Link href={`/${locale}`} className="mt-2 rounded-xl px-3 py-2.5 text-sm text-mute hover:bg-sand">← {a.nav.backToSite}</Link>
          </nav>
        </aside>
        <section className="min-w-0">
          {isMock && <p className="mb-5 rounded-2xl border border-gold/40 bg-gold/10 p-3 text-sm">{a.common.mockBanner}</p>}
          {children}
        </section>
      </div>
    </AdminCtx.Provider>
  );
}
