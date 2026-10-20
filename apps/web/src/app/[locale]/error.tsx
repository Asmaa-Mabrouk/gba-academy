"use client";
import { usePathname } from "next/navigation";
import { ar } from "@/lib/dict/ar";
import { en } from "@/lib/dict/en";

// Segment error boundary: a failed render shows a friendly retry instead of a blank page.
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = (usePathname() ?? "").startsWith("/en") ? en.errorPage : ar.errorPage;
  return (
    <div className="container-x py-32 text-center" role="alert">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-[var(--color-muted,#6b6b6b)]">{t.text}</p>
      <button type="button" onClick={reset} className="btn btn-navy mt-8">{t.retry}</button>
    </div>
  );
}
