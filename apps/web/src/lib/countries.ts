/** Dial codes for the phone field. Gulf and Arab countries first, then common others. Names come from Intl.DisplayNames. */
export interface Country { code: string; dial: string; min: number; max: number; startsWith?: string }
export const DEFAULT_COUNTRY = "SA";
export const COUNTRIES: Country[] = [
  { code: "SA", dial: "+966", min: 9, max: 9, startsWith: "5" },
  { code: "AE", dial: "+971", min: 9, max: 9, startsWith: "5" },
  { code: "KW", dial: "+965", min: 8, max: 8 },
  { code: "QA", dial: "+974", min: 8, max: 8 },
  { code: "BH", dial: "+973", min: 8, max: 8 },
  { code: "OM", dial: "+968", min: 8, max: 8 },
  { code: "EG", dial: "+20", min: 10, max: 10, startsWith: "1" },
  { code: "JO", dial: "+962", min: 9, max: 9, startsWith: "7" },
  { code: "LB", dial: "+961", min: 7, max: 8 },
  { code: "IQ", dial: "+964", min: 10, max: 10, startsWith: "7" },
  { code: "SY", dial: "+963", min: 9, max: 9 },
  { code: "PS", dial: "+970", min: 9, max: 9 },
  { code: "YE", dial: "+967", min: 9, max: 9 },
  { code: "SD", dial: "+249", min: 9, max: 9 },
  { code: "LY", dial: "+218", min: 9, max: 10 },
  { code: "TN", dial: "+216", min: 8, max: 8 },
  { code: "DZ", dial: "+213", min: 9, max: 9 },
  { code: "MA", dial: "+212", min: 9, max: 9 },
  { code: "TR", dial: "+90", min: 10, max: 10, startsWith: "5" },
  { code: "PK", dial: "+92", min: 10, max: 10 },
  { code: "IN", dial: "+91", min: 10, max: 10 },
  { code: "GB", dial: "+44", min: 10, max: 10 },
  { code: "US", dial: "+1", min: 10, max: 10 },
  { code: "CA", dial: "+1", min: 10, max: 10 },
  { code: "DE", dial: "+49", min: 10, max: 11 },
  { code: "FR", dial: "+33", min: 9, max: 9 },
];
export const byCode = (c: string) => COUNTRIES.find((x) => x.code === c) ?? COUNTRIES[0];
export const countryName = (code: string, locale: string) => {
  try { return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code; } catch { return code; }
};
/** Digits only, without a leading 0 (people type 0555... for Saudi numbers). */
export const cleanNational = (v: string) => v.replace(/\D/g, "").replace(/^0+/, "");
export function phoneOk(code: string, national: string): boolean {
  const c = byCode(code); const n = cleanNational(national);
  return n.length >= c.min && n.length <= c.max && (!c.startsWith || n.startsWith(c.startsWith));
}
export const fullPhone = (code: string, national: string) => `${byCode(code).dial}${cleanNational(national)}`;
