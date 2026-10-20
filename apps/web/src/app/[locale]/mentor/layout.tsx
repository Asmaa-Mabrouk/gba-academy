import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { MentorShell } from "@/components/mentor/MentorShell";
import { isLocale } from "@/lib/i18n";

export const metadata = { title: "Mentor", robots: { index: false, follow: false } };

export default async function MentorLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MentorShell locale={locale}>{children}</MentorShell>;
}
