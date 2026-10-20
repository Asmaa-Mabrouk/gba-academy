import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { dirOf, getDict, isLocale, LOCALES } from "@/lib/i18n";
import { Providers } from "@/lib/store";

export function generateStaticParams() { return LOCALES.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return { title: { default: `${t.brand.name} | ${t.brand.tagline}`, template: `%s | ${t.brand.name}` }, description: t.home.subtitle, icons: { icon: "/favicon-64.png" } };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body>
        <Providers locale={locale}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:p-3">Skip</a>
          <Header locale={locale} t={t} />
          <main id="main">{children}</main>
          <Footer locale={locale} t={t} />
        </Providers>
      </body>
    </html>
  );
}
