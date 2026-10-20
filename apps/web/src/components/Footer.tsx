import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function Footer({ locale, t }: { locale: Locale; t: Dict }) {
  const L = (p: string) => `/${locale}${p}`;
  return (
    <footer className="mt-24 bg-navy text-white/75">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/favicon-64.png" alt="" width={44} height={44} />
            <span className="text-lg font-extrabold gold-text">{t.brand.name}</span>
          </div>
          <p className="mt-4 max-w-md leading-relaxed">{t.footer.about}</p>
          <p className="mt-4 text-sm text-gold-light/80">{t.footer.ecosystem}</p>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-white">{t.footer.explore}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href={L("/courses")} className="hover:text-gold-light">{t.nav.courses}</Link></li>
            <li><Link href={L("/courses?mode=live")} className="hover:text-gold-light">{t.nav.live}</Link></li>
            <li><Link href={L("/mentors")} className="hover:text-gold-light">{t.nav.mentors}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-white">{t.footer.support}</h3>
          <ul className="space-y-2 text-sm">
            <li>{t.footer.terms}</li><li>{t.footer.privacy}</li><li>{t.footer.refund}</li><li>{t.footer.faq}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}. · {t.common.vatIncluded}</div>
    </footer>
  );
}
