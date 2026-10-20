import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { isLocale } from "@/lib/i18n";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AdminShell locale={locale}>{children}</AdminShell>;
}
