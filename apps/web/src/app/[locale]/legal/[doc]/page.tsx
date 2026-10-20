import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL, LEGAL_KEYS, type LegalKey } from "@/lib/dict/legal";
import { dateOnly, getDict, isLocale, LOCALES, tr } from "@/lib/i18n";
import { ACADEMY_LEGAL, DRAFT_CONTENT, TERMS_VERSION } from "@/lib/placeholders";

export function generateStaticParams() { return LOCALES.flatMap((locale) => LEGAL_KEYS.map((doc) => ({ locale, doc }))); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string; doc: string }> }) {
  const { locale, doc } = await params;
  if (!isLocale(locale) || !LEGAL_KEYS.includes(doc as LegalKey)) return {};
  return { title: LEGAL[locale][doc as LegalKey].title };
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string; doc: string }> }) {
  const { locale, doc } = await params;
  if (!isLocale(locale) || !LEGAL_KEYS.includes(doc as LegalKey)) notFound();
  const d = LEGAL[locale][doc as LegalKey];
  const t = getDict(locale);
  const labels: Record<LegalKey, string> = { terms: t.footer.terms, privacy: t.footer.privacy, refund: t.footer.refund };
  const L = (p: string) => `/${locale}${p}`;
  return (
    <>
      <section className="band py-12">
        <div className="container-x">
          <nav className="text-sm text-navy/60"><Link href={L("")} className="hover:text-gold-deep">{t.legal.backHome}</Link></nav>
          <h1 className="mt-3 text-4xl font-black text-navy">{d.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-navy/70">{d.intro}</p>
          <p className="mt-4 text-sm text-mute">{t.legal.version}: <span dir="ltr">{TERMS_VERSION}</span></p>
        </div>
      </section>
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="card p-3" aria-label={t.legal.toc}>
            {LEGAL_KEYS.map((k) => (
              <Link key={k} href={L(`/legal/${k}`)} aria-current={k === doc ? "page" : undefined} className={`block rounded-xl px-3 py-2.5 text-sm font-bold ${k === doc ? "bg-navy text-gold-light" : "text-navy hover:bg-sand"}`}>{labels[k]}</Link>
            ))}
          </nav>
        </aside>
        <article className="max-w-3xl">
          {DRAFT_CONTENT && <p className="mb-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">{t.legal.draftBanner}</p>}
          {d.sections.map((s) => (
            <section key={s.h} className="mb-8">
              <h2 className="text-xl font-black text-navy">{s.h}</h2>
              {s.p.map((x, i) => <p key={i} className="mt-2 leading-8 text-ink/90">{x}</p>)}
            </section>
          ))}
          <section className="card mt-10 p-6">
            <h2 className="text-lg font-black text-navy">{t.legal.company}</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-mute">{t.legal.cr}</dt><dd className="font-bold" dir="ltr">{ACADEMY_LEGAL.crNumber}</dd></div>
              <div><dt className="text-mute">{t.legal.vat}</dt><dd className="font-bold" dir="ltr">{ACADEMY_LEGAL.vatNumber}</dd></div>
              <div><dt className="text-mute">{t.legal.licence}</dt><dd className="font-bold" dir="ltr">{ACADEMY_LEGAL.trainingLicence}</dd></div>
              <div><dt className="text-mute">{t.legal.contact}</dt><dd className="font-bold" dir="ltr">{ACADEMY_LEGAL.email} · {ACADEMY_LEGAL.phone}</dd></div>
              <div className="sm:col-span-2"><dt className="text-mute">{tr(ACADEMY_LEGAL.city, locale)}</dt></div>
            </dl>
            {DRAFT_CONTENT && <p className="mt-3 text-xs text-gold-deep">{t.legal.sample}</p>}
          </section>
        </article>
      </div>
    </>
  );
}
