import { notFound } from "next/navigation";
import { CertificateView } from "@/components/CertificateView";
import { catalog } from "@/lib/api";
import { getDict, isLocale } from "@/lib/i18n";

export const metadata = { title: "Certificate" };

export default async function CertificatePage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  if (!isLocale(locale)) notFound();
  const [courses, mentors] = await Promise.all([catalog.courses(), catalog.mentors()]);
  return <CertificateView locale={locale} t={getDict(locale)} code={decodeURIComponent(code)} courses={courses} mentors={mentors} />;
}
