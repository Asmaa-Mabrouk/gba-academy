"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, isMock } from "@/lib/api";
import type { Dict } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { DEMO_USER } from "@/lib/mock-data";
import type { Locale } from "@/lib/types";
import { GpmfSpiral } from "./GpmfSpiral";

export function AuthForm({ mode, locale, t }: { mode: "login" | "register"; locale: Locale; t: Dict }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [f, setF] = useState({ fullName: "", email: "", mobile: "", password: "", forChild: false, terms: false, marketing: false });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isReg = mode === "register";
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    if (isReg && !f.terms) return setErr(t.auth.accept);
    setBusy(true);
    try {
      if (isReg) await register({ fullName: f.fullName, email: f.email, mobile: f.mobile, password: f.password, locale, registeringFor: f.forChild ? "child" : "self", marketingConsent: f.marketing });
      else await login(f.email, f.password);
      router.push(next && next.startsWith("/") ? next : `/${locale}/my-courses`);
    } catch (x) {
      const code = x instanceof ApiError ? x.code : "";
      setErr(code === "email_exists" ? t.auth.exists : code === "weak_password" ? t.auth.weak : code === "invalid_credentials" ? t.auth.invalid : t.common.error);
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      {/* Animated brand panel */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-navy lg:flex">
        <div className="absolute inset-0" style={{ background: "radial-gradient(70% 70% at 50% 45%, rgb(196 156 62 / .25), transparent 70%)" }} />
        {[0, 1, 2, 3].map((i) => <span key={i} className="absolute rounded-full border border-gold/15" style={{ width: 360 + i * 150, height: 360 + i * 150, animation: `spin-${i % 2 ? "rev" : "fwd"} ${50 + i * 20}s linear infinite`, borderStyle: i % 2 ? "dashed" : "solid" }} />)}
        <div className="relative text-center text-white">
          <GpmfSpiral size={340} className="mx-auto" />
          <h2 className="mt-8 text-3xl font-black gold-text">{t.auth.sideTitle}</h2>
          <p className="mx-auto mt-3 max-w-sm text-white/70">{t.auth.sideText}</p>
        </div>
      </div>
      {/* Form */}
      <div className="flex items-center justify-center bg-sand/50 px-5 py-12">
        <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-7 shadow-xl" noValidate>
          <div className="lg:hidden"><GpmfSpiral size={90} className="mx-auto" /></div>
          <div>
            <h1 className="text-3xl font-black text-navy">{isReg ? t.auth.registerTitle : t.auth.loginTitle}</h1>
            <p className="mt-1 text-sm text-mute">{isReg ? t.auth.registerSubtitle : t.auth.loginSubtitle}</p>
          </div>
          {isReg && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-sand p-1 text-sm font-bold" role="radiogroup" aria-label={t.auth.registeringFor}>
              {[[false, t.auth.forSelf], [true, t.auth.forChild]].map(([v, l]) => (
                <button type="button" key={String(v)} role="radio" aria-checked={f.forChild === v} onClick={() => set("forChild", v as boolean)} className={`rounded-xl px-2 py-2.5 transition ${f.forChild === v ? "bg-navy text-gold-light shadow" : "text-navy/70"}`}>{l as string}</button>
              ))}
            </div>
          )}
          {isReg && f.forChild && <p className="rounded-xl bg-teal/20 p-3 text-xs">{t.auth.childHint}</p>}
          {isReg && <Field label={t.auth.fullName}><input className="input" required autoComplete="name" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>}
          <Field label={t.auth.email}><input className="input" type="email" required autoComplete="email" dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
          {isReg && <Field label={t.auth.mobile}><input className="input" type="tel" autoComplete="tel" dir="ltr" placeholder="05XXXXXXXX" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>}
          <Field label={t.auth.password}>
            <div className="relative">
              <input className="input !pe-16" type={show ? "text" : "password"} required dir="ltr" autoComplete={isReg ? "new-password" : "current-password"} value={f.password} onChange={(e) => set("password", e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gold-deep">{show ? t.auth.hide : t.auth.show}</button>
            </div>
            {isReg && <span className="mt-1 block text-xs text-mute">{t.auth.passwordHint}</span>}
          </Field>
          {isReg && (
            <div className="space-y-2 text-sm">
              <label className="flex gap-2"><input type="checkbox" checked={f.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-1 accent-[#c49c3e]" />{t.auth.terms}</label>
              <label className="flex gap-2 text-mute"><input type="checkbox" checked={f.marketing} onChange={(e) => set("marketing", e.target.checked)} className="mt-1 accent-[#c49c3e]" />{t.auth.marketing}</label>
            </div>
          )}
          {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
          <button className="btn btn-gold w-full" disabled={busy}>{busy ? t.common.loading : isReg ? t.auth.registerBtn : t.auth.loginBtn}</button>
          <p className="text-center text-sm text-mute">
            {isReg ? t.auth.haveAccount : t.auth.noAccount}{" "}
            <Link className="font-bold text-gold-deep hover:underline" href={`/${locale}/${isReg ? "login" : "register"}`}>{isReg ? t.nav.login : t.nav.register}</Link>
          </p>
          {!isReg && isMock && (
            <button type="button" className="w-full rounded-xl border border-dashed border-gold p-3 text-xs text-mute hover:bg-sand" onClick={() => setF((p) => ({ ...p, email: DEMO_USER.email, password: DEMO_USER.password }))}>
              {t.auth.demoHint}: <b dir="ltr">{DEMO_USER.email}</b> / <b dir="ltr">{DEMO_USER.password}</b>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-navy"><span className="mb-1.5 block">{label}</span>{children}</label>;
}
