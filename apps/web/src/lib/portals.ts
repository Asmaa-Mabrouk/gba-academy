import type { Locale, User } from "./types";

/**
 * One login, several interfaces. The signed-in user's roles decide which portals exist for them.
 * Learners always have the public site and "My courses". Add the mentor portal here when it is built.
 */
export const MENTOR_PORTAL_READY = false;

export function portalsFor(user: User | null, locale: Locale): { role: "admin" | "mentor"; href: string }[] {
  if (!user) return [];
  const out: { role: "admin" | "mentor"; href: string }[] = [];
  if (user.roles.includes("admin")) out.push({ role: "admin", href: `/${locale}/admin` });
  if (MENTOR_PORTAL_READY && user.roles.includes("mentor")) out.push({ role: "mentor", href: `/${locale}/mentor` });
  return out;
}

/** Where to land right after logging in (when no `next` page was asked for). */
export function landingFor(user: User, locale: Locale): string {
  return portalsFor(user, locale)[0]?.href ?? `/${locale}/my-courses`;
}
