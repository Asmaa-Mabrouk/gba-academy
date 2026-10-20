import { notFound } from "next/navigation";
import { CheckoutView } from "@/components/CheckoutView";
import { getDict, isLocale } from "@/lib/i18n";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CheckoutView locale={locale} t={getDict(locale)} />;
}
