// Prints expected catalogue numbers computed from the sample data, so the E2E suite never hard-codes them.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = join(tmpdir(), "gba-qa"); mkdirSync(tmp, { recursive: true });
writeFileSync(join(tmp, "mock-data.ts"), readFileSync(join(root, "apps/web/src/lib/mock-data.ts"), "utf8").replace('from "./types"', 'from "./types.ts"'));
writeFileSync(join(tmp, "types.ts"), "export {};\n");
const { COURSES, MENTORS, REVIEWS } = await import(pathToFileURL(join(tmp, "mock-data.ts")).href);
const minPrice = (c) => Math.min(...c.offerings.map((o) => o.priceHalalas));
const cnt = (f) => COURSES.filter(f).length;
console.log(JSON.stringify({
  total: COURSES.length, mentors: MENTORS.length, reviews: REVIEWS.length,
  audience: Object.fromEntries(["kids", "youth", "experts"].map((a) => [a, cnt((c) => c.audience === a)])),
  mode: Object.fromEntries(["recorded", "live", "blended"].map((m) => [m, cnt((c) => c.offerings.some((o) => o.mode === m))])),
  level: Object.fromEntries(["beginner", "intermediate", "advanced"].map((l) => [l, cnt((c) => c.level === l)])),
  topic: Object.fromEntries([...new Set(COURSES.map((c) => c.topic))].map((t) => [t, cnt((c) => c.topic === t)])),
  free: cnt((c) => minPrice(c) === 0),
  cheapestSlug: [...COURSES].sort((a, b) => minPrice(a) - minPrice(b))[0].slug,
  priciestSlug: [...COURSES].sort((a, b) => minPrice(b) - minPrice(a))[0].slug,
  searchRisk: cnt((c) => `${c.title.ar} ${c.title.en} ${c.subtitle.ar} ${c.subtitle.en}`.toLowerCase().includes("المخاطر")),
  searchProject: cnt((c) => `${c.title.ar} ${c.title.en} ${c.subtitle.ar} ${c.subtitle.en}`.toLowerCase().includes("project")),
  slugs: COURSES.map((c) => ({ slug: c.slug, titleEn: c.title.en, titleAr: c.title.ar, offerings: c.offerings.map((o) => ({ mode: o.mode, price: o.priceHalalas, sessions: o.sessions.length })), lessons: c.modules.reduce((s, m) => s + m.lessons.length, 0), audience: c.audience })),
  mentorSlugs: MENTORS.map((m) => m.slug),
}));
