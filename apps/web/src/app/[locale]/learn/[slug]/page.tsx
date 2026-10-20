import { notFound } from "next/navigation";
import { Player } from "@/components/Player";
import { catalog } from "@/lib/api";
import { getDict, isLocale } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const course = await catalog.course(slug);
  if (!course) notFound();
  return <Player course={course} locale={locale} t={getDict(locale)} />;
}
