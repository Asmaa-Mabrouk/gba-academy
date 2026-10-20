import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { ACADEMY_LEGAL, DRAFT_CONTENT } from "@/lib/placeholders";
import type { Locale } from "@/lib/types";

export function Footer({ locale, t }: { locale: Locale; t: Dict }) {
  const L = (p: string) => `/${locale}${p}`;
  return (
    <footer className="mt-24 border-t border-navy/10 bg-sand text-navy/75">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/favicon-64.png" alt="" width={44} height={44} />
            <span className="text-lg font-extrabold gold-text">{t.brand.name}</span>
          </div>
          <p className="mt-4 max-w-md leading-relaxed">{t.footer.about}</p>
          <p className="mt-4 text-sm text-gold-deep">{t.footer.ecosystem}</p>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-navy">{t.footer.explore}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href={L("/courses")} className="hover:text-gold-deep">{t.nav.courses}</Link></li>
            <li><Link href={L("/courses?mode=live")} className="hover:text-gold-deep">{t.nav.live}</Link></li>
            <li><Link href={L("/mentors")} className="hover:text-gold-deep">{t.nav.mentors}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-navy">{t.footer.support}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href={L("/legal/terms")} className="hover:text-gold-deep">{t.footer.terms}</Link></li><li><Link href={L("/legal/privacy")} className="hover:text-gold-deep">{t.footer.privacy}</Link></li><li><Link href={L("/legal/refund")} className="hover:text-gold-deep">{t.footer.refund}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy/10 py-6 text-center text-xs text-mute">
        <p className="container-x flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span>{t.legal.cr}: <b dir="ltr">{ACADEMY_LEGAL.crNumber}</b></span>
          <span>{t.legal.vat}: <b dir="ltr">{ACADEMY_LEGAL.vatNumber}</b></span>
          <span>{t.legal.licence}: <b dir="ltr">{ACADEMY_LEGAL.trainingLicence}</b></span>
          {DRAFT_CONTENT && <span className="chip bg-gold/20 text-gold-deep">{t.legal.sample}</span>}
        </p>
        <p className="mt-3">© {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}. · {t.common.vatIncluded}</p></div>
    </footer>
  );
}
