"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminCtx } from "../admin/AdminShell";
import { ApiError, isMock } from "@/lib/api";
import { getAdminDict } from "@/lib/dict/admin";
import { mentorApi } from "@/lib/mentor-api";
import { useAuth } from "@/lib/store";
import type { Locale } from "@/lib/types";

/** Guards /mentor (role "mentor" + a linked mentor profile) and draws the sidebar. Same pattern as AdminShell. */
export function MentorShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const a = getAdminDict(locale);
  const { user, token, ready } = useAuth();
  const path = usePathname() ?? "";
  const [state, setState] = useState<"loading" | "ok" | "noprofile">("loading");
  const L = (p: string) => `/${locale}/mentor${p}`;

  useEffect(() => {
    if (!token || !user?.roles.includes("mentor")) return;
    mentorApi.me(token).then(() => setState("ok")).catch((e) => setState(e instanceof ApiError && e.code === "no_mentor_profile" ? "noprofile" : "ok"));
  }, [token, user]);

  if (!ready) return <div className="container-x py-24 text-center text-mute">{a.common.loading}</div>;
  if (!user || !token || !user.roles.includes("mentor"))
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-2xl font-black text-navy">{a.common.noAccess}</h1>
        <p className="mt-2 text-mute">{locale === "ar" ? "هذه المنطقة للمرشدين. سجّل الدخول بحساب مرشد." : "This area is for mentors. Sign in with a mentor account."}</p>
        <Link href={`/${locale}/login?next=/${locale}/mentor`} className="btn btn-gold mt-6">{locale === "ar" ? "تسجيل الدخول" : "Log in"}</Link>
      </div>
    );
  if (state === "noprofile")
    return <div className="container-x py-24 text-center"><h1 className="text-2xl font-black text-navy">{a.mp.noProfile}</h1><p className="mt-2 text-mute">{a.mp.noProfileText}</p></div>;

  const n = a.mp.nav;
  const items = [["", n.overview, "▦"], ["/courses", n.courses, "▤"], ["/sessions", n.sessions, "●"], ["/learners", n.learners, "☰"], ["/reviews", n.reviews, "★"], ["/profile", n.profile, "☺"]] as const;
  const active = (p: string) => (p === "" ? path === `/${locale}/mentor` : path.startsWith(L(p)));

  return (
    <AdminCtx.Provider value={{ locale, a, token }}>
      <div className="container-x grid gap-6 py-8 lg:grid-cols-[230px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-gold-deep">{a.mp.title}</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={a.mp.title}>
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
