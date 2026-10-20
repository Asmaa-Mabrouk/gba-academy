"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast";
import { expiryOk, luhn } from "@/lib/validate";
import { ApiError, isMock, userApi } from "@/lib/api";
import { money, type Dict } from "@/lib/i18n";
import { useAuth, useCart } from "@/lib/store";
import type { Locale, Order, PaymentMethod, PromoQuote } from "@/lib/types";
import { Summary } from "./CartView";

export function CheckoutView({ locale, t }: { locale: Locale; t: Dict }) {
  const { lines, clear } = useCart();
  const { token, ready } = useAuth();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("mada");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toast = useToast();
  const [card, setCard] = useState({ number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" });
  const [agree, setAgree] = useState(false);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<Order | null>(null);
  const gross = lines.reduce((s, l) => s + l.priceHalalas, 0);
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<PromoQuote | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const total = quote ? quote.totalHalalas : gross;

  const applyPromo = async () => {
    if (!token || !code.trim()) return;
    setPromoErr("");
    try { setQuote(await userApi.validatePromo(token, code.trim().toUpperCase(), lines.map((l) => l.offeringId), gross)); toast.success(t.checkout.promoApplied); }
    catch (x) {
      const m = t.checkout.promoErrors as Record<string, string>;
      const msg = x instanceof ApiError ? m[x.code] ?? m.default : m.default;
      setQuote(null); setPromoErr(msg); toast.error(msg);
    }
  };

  useEffect(() => { if (ready && !token && !order) router.replace(`/${locale}/login?next=/${locale}/checkout`); }, [ready, token, order, router, locale]);

  const pay = async () => {
    if (!token) return;
    setErr("");
    const e: Record<string, string> = {};
    if (total > 0 && method !== "applepay") {
      if (!luhn(card.number)) e.number = t.v.cardNumber;
      if (!expiryOk(card.expiry)) e.expiry = t.v.expiry;
      if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = t.v.cvc;
    }
    if (!agree) e.agree = t.v.payTerms;
    setFe(e);
    if (Object.keys(e).length) { toast.warning(t.toast.fixFields); return; }
    setBusy(true);
    try { const o = await userApi.checkout(token, lines, method, quote?.code); clear(); setOrder(o); toast.success(t.toast.paid); }
    catch (x) {
      const msg = x instanceof ApiError && x.code === "already_enrolled" ? t.checkout.owned : x instanceof TypeError ? t.toast.network : t.toast.payFailed;
      setErr(msg); toast.error(msg);
    }
    setBusy(false);
  };

  if (order)
    return (
      <div className="container-x py-20 text-center">
        <div className="gold-bg mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl text-navy">✓</div>
        <h1 className="mt-6 text-3xl font-black text-navy">{t.checkout.successTitle}</h1>
        <p className="mt-2 text-mute">{t.checkout.successText}</p>
        <p className="mx-auto mt-4 max-w-md rounded-2xl bg-gold/15 p-4 text-sm font-medium text-navy">{t.encourage[new Date().getDate() % t.encourage.length]}</p>
        <p className="mt-4 text-sm">{t.checkout.order}: <b dir="ltr">{order.number}</b>{order.invoiceNumber && <> · {t.checkout.invoice}: <b dir="ltr">{order.invoiceNumber}</b></>} · {money(order.totalHalalas, locale)}</p>
        <Link href={`/${locale}/my-courses`} className="btn btn-gold mt-8">{t.checkout.goMyCourses}</Link>
      </div>
    );
  if (lines.length === 0) return <div className="container-x py-24 text-center"><Link href={`/${locale}/courses`} className="btn btn-gold">{t.cart.explore}</Link></div>;

  const methods: [PaymentMethod, string][] = [["mada", t.checkout.mada], ["applepay", t.checkout.applepay], ["card", t.checkout.card]];
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-black text-navy">{t.checkout.title}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="card space-y-5 p-6">
          <h2 className="font-bold text-navy">{t.checkout.method}</h2>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
            {methods.map(([m, label]) => (
              <button key={m} role="radio" aria-checked={method === m} onClick={() => setMethod(m)} className={`rounded-2xl border-2 p-4 font-bold transition ${method === m ? "border-gold bg-sand" : "border-navy/10"}`}>{label}</button>
            ))}
          </div>
          {method !== "applepay" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><input dir="ltr" className={`input ${fe.number ? "input-error" : ""}`} placeholder={t.checkout.cardNumber} inputMode="numeric" autoComplete="cc-number" value={card.number} aria-invalid={!!fe.number} onChange={(e) => { setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, "").slice(0, 23) }); setFe({ ...fe, number: "" }); }} aria-label={t.checkout.cardNumber} />{fe.number && <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">⚠ {fe.number}</p>}</div>
              <div><input dir="ltr" className={`input ${fe.expiry ? "input-error" : ""}`} placeholder="MM/YY" autoComplete="cc-exp" value={card.expiry} aria-invalid={!!fe.expiry} onChange={(e) => { setCard({ ...card, expiry: e.target.value.slice(0, 5) }); setFe({ ...fe, expiry: "" }); }} aria-label={t.checkout.expiry} />{fe.expiry && <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">⚠ {fe.expiry}</p>}</div>
              <div><input dir="ltr" className={`input ${fe.cvc ? "input-error" : ""}`} placeholder="CVC" inputMode="numeric" autoComplete="cc-csc" value={card.cvc} aria-invalid={!!fe.cvc} onChange={(e) => { setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }); setFe({ ...fe, cvc: "" }); }} aria-label={t.checkout.cvc} />{fe.cvc && <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">⚠ {fe.cvc}</p>}</div>
            </div>
          )}
          <p className="text-xs text-mute">🔒 {t.checkout.secure}</p>
          {isMock && <p className="rounded-xl bg-gold/15 p-3 text-xs">{t.checkout.demo}</p>}
          <div>
            <label className={`flex gap-2 rounded-xl p-2 text-sm ${fe.agree ? "bg-red-50 ring-1 ring-red-300" : ""}`}><input type="checkbox" checked={agree} aria-invalid={!!fe.agree} onChange={(e) => { setAgree(e.target.checked); setFe({ ...fe, agree: "" }); }} className="mt-1 h-4 w-4 accent-[#c49c3e]" /><span>{t.legal.agreeTerms} <Link href={`/${locale}/legal/terms`} target="_blank" className="font-bold text-gold-deep underline">{t.footer.terms}</Link> {t.legal.and} <Link href={`/${locale}/legal/refund`} target="_blank" className="font-bold text-gold-deep underline">{t.footer.refund}</Link></span></label>
            {fe.agree && <p role="alert" className="mt-1 px-2 text-xs font-medium text-red-700">⚠ {fe.agree}</p>}
          </div>
          {err && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">⚠ {err}</p>}
        </section>
        <aside className="card h-fit space-y-4 p-6">
          <h2 className="font-bold text-navy">{t.checkout.summary}</h2>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-navy" htmlFor="promo">{t.checkout.promoLabel}</label>
            {quote ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                <span>✓ <b dir="ltr">{quote.code}</b> · {quote.percentOff}%</span>
                <button type="button" className="font-bold underline" onClick={() => { setQuote(null); setCode(""); }}>{t.checkout.promoRemove}</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input id="promo" dir="ltr" className={`input uppercase ${promoErr ? "input-error" : ""}`} placeholder={t.checkout.promoPlaceholder} value={code} aria-invalid={!!promoErr}
                  onChange={(e) => { setCode(e.target.value); setPromoErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") applyPromo(); }} />
                <button type="button" className="btn btn-outline" onClick={applyPromo}>{t.checkout.promoApply}</button>
              </div>
            )}
            {promoErr && <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">⚠ {promoErr}</p>}
          </div>
          <Summary total={total} locale={locale} t={t} />
          {quote && <p className="flex justify-between text-sm font-bold text-emerald-700"><span>{t.checkout.promoDiscount}</span><span>−{money(quote.discountHalalas, locale)}</span></p>}
          <button className="btn btn-gold w-full" onClick={pay} disabled={busy}>{busy ? t.checkout.processing : `${t.checkout.pay} · ${money(total, locale)}`}</button>
        </aside>
      </div>
    </div>
  );
}
