"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { portalsFor } from "@/lib/portals";
import { useAuth, useCart } from "@/lib/store";

export function Header({ locale, t }: { locale: Locale; t: Dict }) {
  const path = usePathname() ?? `/${locale}`;
  const other: Locale = locale === "ar" ? "en" : "ar";
  const switchHref = path.replace(/^\/(ar|en)/, `/${other}`);
  const { user, logout, ready } = useAuth();
  const { lines } = useCart();
  const [open, setOpen] = useState(false);
  const L = (p: string) => `/${locale}${p}`;
  const links = [
    { href: L("/courses"), label: t.nav.courses },
    { href: L("/courses?audience=kids"), label: t.nav.kids },
    { href: L("/courses?audience=youth"), label: t.nav.youth },
    { href: L("/courses?audience=experts"), label: t.nav.experts },
    { href: L("/courses?mode=live"), label: t.nav.live },
    { href: L("/mentors"), label: t.nav.mentors },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/90 text-white backdrop-blur-xl">
      <div className="container-x flex h-[72px] items-center gap-6">
        <Link href={L("")} className="flex items-center gap-3" aria-label={t.brand.name}>
          <img src="/favicon-64.png" alt="" width={40} height={40} className="h-10 w-10" />
          <span className="hidden leading-tight sm:block">
            <span className="block text-[15px] font-extrabold gold-text">{t.brand.name}</span>
            <span className="block text-[11px] text-white/60">{t.brand.tagline}</span>
          </span>
        </Link>
        <nav className="ms-4 hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-gold-light">{l.label}</Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Link href={switchHref} className="rounded-full border border-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/10" hrefLang={other}>{t.nav.language}</Link>
          <Link href={L("/cart")} className="relative rounded-full p-2 hover:bg-white/10" aria-label={t.nav.cart}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.2a2 2 0 002-1.5L20 8H6.2"/><circle cx="10" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/></svg>
            {lines.length > 0 && <span className="gold-bg absolute -top-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-navy">{lines.length}</span>}
          </Link>
          {ready && !user && (
            <>
              <Link href={L("/login")} className="hidden px-3 py-2 text-sm font-medium hover:text-gold-light sm:block">{t.nav.login}</Link>
              <Link href={L("/register")} className="btn btn-gold !px-5 !py-2 text-sm">{t.nav.register}</Link>
            </>
          )}
          {ready && user && (
            <>
              {portalsFor(user, locale).map((p) => (
                <Link key={p.role} href={p.href} className="hidden whitespace-nowrap rounded-full border border-gold/50 px-3 py-1.5 text-sm font-bold text-gold-light hover:bg-white/10 sm:block">{p.role === "admin" ? t.nav.admin : t.nav.mentorPortal}</Link>
              ))}
              <Link href={L("/my-courses")} className="hidden whitespace-nowrap px-3 py-2 text-sm font-medium hover:text-gold-light sm:block">{t.nav.myCourses}</Link>
              <button onClick={logout} className="btn btn-ghost !px-4 !py-2 text-sm">{t.nav.logout}</button>
            </>
          )}
          <button className="rounded-full p-2 hover:bg-white/10 lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="container-x grid gap-1 border-t border-white/10 pb-4 pt-2 lg:hidden" aria-label="Mobile">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-medium hover:bg-white/10">{l.label}</Link>)}
          {user && portalsFor(user, locale).map((p) => <Link key={p.role} href={p.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-bold text-gold-light hover:bg-white/10">{p.role === "admin" ? t.nav.admin : t.nav.mentorPortal}</Link>)}
          {user && <Link href={L("/my-courses")} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-medium hover:bg-white/10">{t.nav.myCourses}</Link>}
        </nav>
      )}
    </header>
  );
}
