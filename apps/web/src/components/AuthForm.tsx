"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ApiError, isMock } from "@/lib/api";
import type { Dict } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import { DEMO_ACCOUNTS } from "@/lib/mock-data";
import { landingFor } from "@/lib/portals";
import { TERMS_VERSION } from "@/lib/placeholders";
import { useToast } from "@/lib/toast";
import { pwRules, validateAuth, type Errors } from "@/lib/validate";
import type { Locale } from "@/lib/types";
import { GpmfSpiral } from "./GpmfSpiral";

export function AuthForm({ mode, locale, t }: { mode: "login" | "register"; locale: Locale; t: Dict }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [f, setF] = useState({ fullName: "", email: "", mobile: "", password: "", forChild: false, terms: false, marketing: false });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [fe, setFe] = useState<Errors<"fullName" | "email" | "mobile" | "password" | "terms">>({});
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const isReg = mode === "register";
  const set = (k: keyof typeof f, v: string | boolean) => { setF((p) => ({ ...p, [k]: v })); if (fe[k as keyof typeof fe]) setFe((p) => ({ ...p, [k]: undefined })); };
  const check = (next = f) => { const e = validateAuth(mode, next, t); setFe(e); return e; };
  const blur = (k: keyof typeof fe) => () => { const e = validateAuth(mode, f, t); setFe((p) => ({ ...p, [k]: e[k] })); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const errs = check();
    if (Object.keys(errs).length) {
      toast.error(t.toast.fixFields);
      setTimeout(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(), 0);
      return;
    }
    setBusy(true);
    try {
      const user = isReg
        ? await register({ fullName: f.fullName.trim(), email: f.email.trim(), mobile: f.mobile.replace(/\s/g, ""), password: f.password, locale, registeringFor: f.forChild ? "child" : "self", marketingConsent: f.marketing, acceptedTerms: true, termsVersion: TERMS_VERSION })
        : await login(f.email.trim(), f.password);
      toast.success((isReg ? t.toast.registered : t.toast.welcome).replace("{name}", user.fullName.split(" ")[0]));
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : landingFor(user, locale));
    } catch (x) {
      const code = x instanceof ApiError ? x.code : "";
      if (code === "email_exists") setFe({ email: t.auth.exists });
      else if (code === "weak_password") setFe({ password: t.v.passwordWeak });
      else if (code === "invalid_credentials") setErr(t.auth.invalid);
      else if (x instanceof TypeError) setErr(t.toast.network);
      else setErr(t.common.error);
      if (code !== "email_exists" && code !== "weak_password") toast.error(code === "invalid_credentials" ? t.auth.invalid : x instanceof TypeError ? t.toast.network : t.common.error);
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      {/* Animated brand panel */}
      <div className="relative hidden items-center justify-center overflow-hidden band lg:flex">
        <div className="absolute inset-0" style={{ background: "radial-gradient(70% 70% at 50% 45%, rgb(196 156 62 / .25), transparent 70%)" }} />
        {[0, 1, 2, 3].map((i) => <span key={i} className="absolute rounded-full border border-gold/15" style={{ width: 360 + i * 150, height: 360 + i * 150, animation: `spin-${i % 2 ? "rev" : "fwd"} ${50 + i * 20}s linear infinite`, borderStyle: i % 2 ? "dashed" : "solid" }} />)}
        <div className="relative text-center text-navy">
          <GpmfSpiral size={340} className="mx-auto" />
          <h2 className="mt-8 text-3xl font-black gold-text">{t.auth.sideTitle}</h2>
          <p className="mx-auto mt-3 max-w-sm text-navy/70">{t.auth.sideText}</p>
        </div>
      </div>
      {/* Form */}
      <div className="flex items-center justify-center bg-cream px-5 py-12">
        <form ref={formRef} onSubmit={submit} className="card w-full max-w-md space-y-3 p-7 shadow-xl sm:p-9" noValidate>
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
          {isReg && <Field label={t.auth.fullName} error={fe.fullName} id="fullName"><input id="fullName" className={`input ${fe.fullName ? "input-error" : ""}`} aria-invalid={!!fe.fullName} aria-describedby={fe.fullName ? "fullName-err" : undefined} autoComplete="name" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} onBlur={blur("fullName")} /></Field>}
          <Field label={t.auth.email} error={fe.email} id="email"><input id="email" className={`input ${fe.email ? "input-error" : ""}`} type="email" aria-invalid={!!fe.email} aria-describedby={fe.email ? "email-err" : undefined} autoComplete="email" dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} onBlur={blur("email")} /></Field>
          {isReg && <Field label={t.auth.mobile} error={fe.mobile} id="mobile"><input id="mobile" className={`input ${fe.mobile ? "input-error" : ""}`} type="tel" aria-invalid={!!fe.mobile} aria-describedby={fe.mobile ? "mobile-err" : undefined} autoComplete="tel" dir="ltr" inputMode="numeric" placeholder="05XXXXXXXX" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} onBlur={blur("mobile")} /></Field>}
          <Field label={t.auth.password} error={fe.password} id="password">
            <div className="relative">
              <input id="password" className={`input !pe-16 ${fe.password ? "input-error" : ""}`} type={show ? "text" : "password"} aria-invalid={!!fe.password} aria-describedby={fe.password ? "password-err" : undefined} dir="ltr" autoComplete={isReg ? "new-password" : "current-password"} value={f.password} onChange={(e) => set("password", e.target.value)} onBlur={blur("password")} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1 text-xs font-bold text-gold-deep">{show ? t.auth.hide : t.auth.show}</button>
            </div>
            {isReg && (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={t.auth.passwordHint}>
                {(Object.keys(t.v.rules) as (keyof typeof t.v.rules)[]).map((k) => {
                  const ok = pwRules(f.password)[k];
                  return <li key={k} className={ok ? "font-bold text-emerald-700" : "text-mute"}>{ok ? "✓" : "○"} {t.v.rules[k]}</li>;
                })}
              </ul>
            )}
          </Field>
          {isReg && (
            <div className="space-y-2 text-sm">
              <label className={`flex gap-2 rounded-xl p-2 ${fe.terms ? "bg-red-50 ring-1 ring-red-300" : ""}`}><input type="checkbox" checked={f.terms} aria-invalid={!!fe.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-1 h-4 w-4 accent-[#c49c3e]" /><span>{t.legal.agreeTerms} <Link href={`/${locale}/legal/terms`} target="_blank" className="font-bold text-gold-deep underline">{t.footer.terms}</Link> {t.legal.and} <Link href={`/${locale}/legal/privacy`} target="_blank" className="font-bold text-gold-deep underline">{t.footer.privacy}</Link></span></label>
              <p id="terms-err" role={fe.terms ? "alert" : undefined} className="min-h-4 px-2 text-xs font-medium leading-4 text-red-700">{fe.terms ? `⚠ ${fe.terms}` : ""}</p>
              <label className="flex gap-2 text-mute"><input type="checkbox" checked={f.marketing} onChange={(e) => set("marketing", e.target.checked)} className="mt-1 accent-[#c49c3e]" />{t.auth.marketing}</label>
            </div>
          )}
          {err && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">⚠ {err}</p>}
          <button className="btn btn-gold w-full" disabled={busy}>{busy ? t.common.loading : isReg ? t.auth.registerBtn : t.auth.loginBtn}</button>
          <p className="text-center text-sm text-mute">
            {isReg ? t.auth.haveAccount : t.auth.noAccount}{" "}
            <Link className="font-bold text-gold-deep hover:underline" href={`/${locale}/${isReg ? "login" : "register"}`}>{isReg ? t.nav.login : t.nav.register}</Link>
          </p>
          {!isReg && isMock && (
            <div className="space-y-2 rounded-xl border border-dashed border-gold p-3 text-xs text-mute">
              <p className="font-bold">{t.auth.demoHint}</p>
              {DEMO_ACCOUNTS.map((d) => (
                <button type="button" key={d.key} className="block w-full rounded-lg p-2 text-start hover:bg-sand" onClick={() => setF((p) => ({ ...p, email: d.email, password: d.password }))}>
                  <b dir="ltr">{d.email}</b> / <b dir="ltr">{d.password}</b> <span className="text-gold-deep">({d.roles.filter((r) => r !== "learner").join(", ") || "learner"})</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
function Field({ label, error, id, children }: { label: string; error?: string; id: string; children: React.ReactNode }) {
  return (
    <div className="text-sm font-bold text-navy">
      <label htmlFor={id} className="mb-1.5 block">{label}</label>
      {children}
      {/* The slot is always reserved so showing an error never shifts the layout under the user's click. */}
      <p id={`${id}-err`} role={error ? "alert" : undefined} className="mt-1.5 min-h-4 text-xs font-medium leading-4 text-red-700">{error ? `⚠ ${error}` : ""}</p>
    </div>
  );
}
