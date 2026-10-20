import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KidsWorld } from "@/components/kids/KidsWorld";
import { getKidsDict } from "@/lib/dict/kids";
import { getDict, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? getKidsDict(locale).title : undefined };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <KidsWorld locale={locale} t={getDict(locale)} />;
}
