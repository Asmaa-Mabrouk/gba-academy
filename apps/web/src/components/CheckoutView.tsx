"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isMock, userApi } from "@/lib/api";
import { money, type Dict } from "@/lib/i18n";
import { useAuth, useCart } from "@/lib/store";
import type { Locale, Order, PaymentMethod } from "@/lib/types";
import { Summary } from "./CartView";

export function CheckoutView({ locale, t }: { locale: Locale; t: Dict }) {
  const { lines, clear } = useCart();
  const { token, ready } = useAuth();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("mada");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const total = lines.reduce((s, l) => s + l.priceHalalas, 0);

  useEffect(() => { if (ready && !token && !order) router.replace(`/${locale}/login?next=/${locale}/checkout`); }, [ready, token, order, router, locale]);

  const pay = async () => {
    if (!token) return;
    setBusy(true); setErr("");
    try { const o = await userApi.checkout(token, lines, method); clear(); setOrder(o); }
    catch { setErr(t.checkout.failed); }
    setBusy(false);
  };

  if (order)
    return (
      <div className="container-x py-20 text-center">
        <div className="gold-bg mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl text-navy">✓</div>
        <h1 className="mt-6 text-3xl font-black text-navy">{t.checkout.successTitle}</h1>
        <p className="mt-2 text-mute">{t.checkout.successText}</p>
        <p className="mt-4 text-sm">{t.checkout.order}: <b dir="ltr">{order.number}</b> · {t.checkout.invoice}: <b dir="ltr">{order.invoiceNumber}</b> · {money(order.totalHalalas, locale)}</p>
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
            <div className="grid gap-3 sm:grid-cols-2" dir="ltr">
              <input className="input sm:col-span-2" placeholder={t.checkout.cardNumber} inputMode="numeric" defaultValue="4242 4242 4242 4242" aria-label={t.checkout.cardNumber} />
              <input className="input" placeholder="MM/YY" defaultValue="12/30" aria-label={t.checkout.expiry} />
              <input className="input" placeholder="CVC" defaultValue="123" aria-label={t.checkout.cvc} />
            </div>
          )}
          <p className="text-xs text-mute">🔒 {t.checkout.secure}</p>
          {isMock && <p className="rounded-xl bg-gold/15 p-3 text-xs">{t.checkout.demo}</p>}
          {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        </section>
        <aside className="card h-fit space-y-4 p-6">
          <h2 className="font-bold text-navy">{t.checkout.summary}</h2>
          <Summary total={total} locale={locale} t={t} />
          <button className="btn btn-gold w-full" onClick={pay} disabled={busy}>{busy ? t.checkout.processing : `${t.checkout.pay} · ${money(total, locale)}`}</button>
        </aside>
      </div>
    </div>
  );
}
