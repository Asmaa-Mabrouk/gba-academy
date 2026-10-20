import type { Bilingual, Locale } from "./types";
import { ar } from "./dict/ar";
import { en } from "./dict/en";

export const LOCALES: Locale[] = ["ar", "en"];
export const DEFAULT_LOCALE: Locale = "ar";

export type Dict = typeof ar;

export function isLocale(value: string): value is Locale {
  return value === "ar" || value === "en";
}

export function getDict(locale: Locale): Dict {
  return locale === "ar" ? ar : (en as Dict);
}

export function dirOf(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Pick the right language from a bilingual field. */
export function tr(value: Bilingual, locale: Locale): string {
  return value[locale] || value.en;
}

/** Format a price held in halalas, VAT included. */
export function money(halalas: number, locale: Locale): string {
  if (halalas === 0) return locale === "ar" ? "مجاني" : "Free";
  const sar = halalas / 100;
  const n = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: sar % 1 === 0 ? 0 : 2,
  }).format(sar);
  return locale === "ar" ? `${n} ر.س` : `SAR ${n}`;
}

export function num(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US").format(value);
}

export function dateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}

export function dateOnly(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", {
    dateStyle: "medium",
    timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}
