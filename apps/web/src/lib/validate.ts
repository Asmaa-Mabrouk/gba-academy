import { phoneOk } from "./countries";
import type { Dict } from "./i18n";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MOBILE_RE = /^05\d{8}$/;
export const pwRules = (p: string) => ({ len: p.length >= 8, letter: /[A-Za-z؀-ۿ]/.test(p), digit: /\d/.test(p) });

export function luhn(num: string): boolean {
  const d = num.replace(/\D/g, "");
  if (d.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) { let n = +d[d.length - 1 - i]; if (i % 2) { n *= 2; if (n > 9) n -= 9; } sum += n; }
  return sum % 10 === 0;
}
export function expiryOk(v: string, now = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(v.trim());
  if (!m) return false;
  const mm = +m[1], yy = 2000 + +m[2];
  return mm >= 1 && mm <= 12 && (yy > now.getFullYear() || (yy === now.getFullYear() && mm >= now.getMonth() + 1));
}

export type Errors<K extends string> = Partial<Record<K, string>>;

export function validateAuth(mode: "login" | "register", f: { fullName: string; email: string; mobile: string; country: string; password: string; terms: boolean }, t: Dict): Errors<"fullName" | "email" | "mobile" | "password" | "terms"> {
  const e: Errors<"fullName" | "email" | "mobile" | "password" | "terms"> = {};
  const email = f.email.trim();
  if (!email) e.email = t.v.emailRequired; else if (!EMAIL_RE.test(email)) e.email = t.v.emailInvalid;
  if (mode === "login") { if (!f.password) e.password = t.v.passwordRequired; return e; }
  if (f.fullName.trim().length < 2) e.fullName = t.v.nameRequired;
  if (f.mobile.trim() && !phoneOk(f.country, f.mobile)) e.mobile = t.v.mobileInvalid;
  const r = pwRules(f.password);
  if (!f.password) e.password = t.v.passwordRequired; else if (!(r.len && r.letter && r.digit)) e.password = t.v.passwordWeak;
  if (!f.terms) e.terms = t.v.termsRequired;
  return e;
}
