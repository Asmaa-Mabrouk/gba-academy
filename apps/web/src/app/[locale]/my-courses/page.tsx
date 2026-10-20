import { notFound } from "next/navigation";
import { MyCourses } from "@/components/MyCourses";
import { getDict, isLocale } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MyCourses locale={locale} t={getDict(locale)} />;
}
