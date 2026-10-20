import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/CourseCard";
import { catalog } from "@/lib/api";
import { getDict, isLocale, num } from "@/lib/i18n";
import type { CourseFilters } from "@/lib/types";

type SP = Record<string, string | undefined>;

export default async function Catalogue({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const t = getDict(locale);
  const f: CourseFilters = {
    q: sp.q, audience: (sp.audience as CourseFilters["audience"]) ?? "all", mode: (sp.mode as CourseFilters["mode"]) ?? "all",
    level: (sp.level as CourseFilters["level"]) ?? "all", topic: sp.topic ?? "all", sort: (sp.sort as CourseFilters["sort"]) ?? "popular", freeOnly: sp.free === "1",
  };
  const [courses, mentors] = await Promise.all([catalog.courses(f), catalog.mentors()]);
  const mById = new Map(mentors.map((m) => [m.id, m]));

  const href = (patch: SP) => {
    const next: SP = { ...sp, ...patch };
    const q = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => v && v !== "all" && q.set(k, v));
    const s = q.toString();
    return `/${locale}/courses${s ? `?${s}` : ""}`;
  };
  const Group = ({ label, k, options }: { label: string; k: string; options: [string, string][] }) => (
    <div>
      <h3 className="mb-2 text-sm font-bold text-navy">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, text]) => {
          const active = (sp[k] ?? "all") === v;
          return <Link key={v} href={href({ [k]: v })} scroll={false} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${active ? "border-navy bg-navy text-gold-light" : "border-navy/15 hover:border-gold hover:bg-sand"}`}>{text}</Link>;
        })}
      </div>
    </div>
  );

  return (
    <>
      <section className="bg-navy py-12 text-white">
        <div className="container-x">
          <h1 className="text-4xl font-black gold-text">{t.catalogue.title}</h1>
          <p className="mt-2 text-white/70">{t.catalogue.subtitle}</p>
          <form action={`/${locale}/courses`} className="mt-6 flex max-w-2xl gap-2">
            {Object.entries(sp).filter(([k, v]) => k !== "q" && v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <input name="q" defaultValue={sp.q} placeholder={t.catalogue.searchPlaceholder} className="input !rounded-full !border-transparent text-ink" aria-label={t.nav.search} />
            <button className="btn btn-gold shrink-0">{t.nav.search.split(" ")[0]}</button>
          </form>
        </div>
      </section>
      <div className="container-x grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Group label={t.catalogue.audience} k="audience" options={[["all", t.audiences.all], ["kids", t.audiences.kids.name], ["youth", t.audiences.youth.name], ["experts", t.audiences.experts.name]]} />
          <Group label={t.catalogue.mode} k="mode" options={[["all", t.modes.all], ["recorded", t.modes.recorded], ["live", t.modes.live], ["blended", t.modes.blended]]} />
          <Group label={t.catalogue.level} k="level" options={[["all", t.levels.all], ["beginner", t.levels.beginner], ["intermediate", t.levels.intermediate], ["advanced", t.levels.advanced]]} />
          <Group label={t.catalogue.topic} k="topic" options={Object.entries(t.catalogue.topics) as [string, string][]} />
          <Link href={href({ free: sp.free === "1" ? undefined : "1" })} className={`inline-block rounded-full border px-3.5 py-1.5 text-sm font-medium ${sp.free === "1" ? "border-navy bg-navy text-gold-light" : "border-navy/15"}`}>{t.catalogue.freeOnly}</Link>
          <div><Link href={`/${locale}/courses`} className="text-sm font-bold text-gold-deep hover:underline">{t.catalogue.reset}</Link></div>
        </aside>
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium text-mute"><b className="text-navy">{num(courses.length, locale)}</b> {t.catalogue.results}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-mute">{t.catalogue.sort}:</span>
              {(Object.keys(t.catalogue.sorts) as (keyof typeof t.catalogue.sorts)[]).map((s) => (
                <Link key={s} href={href({ sort: s })} scroll={false} className={`rounded-full px-3 py-1 ${(sp.sort ?? "popular") === s ? "bg-sand font-bold text-navy" : "text-mute hover:text-navy"}`}>{t.catalogue.sorts[s]}</Link>
              ))}
            </div>
          </div>
          {courses.length === 0 ? (
            <div className="card p-12 text-center text-mute">{t.catalogue.noResults}</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((c) => <CourseCard key={c.id} course={c} mentor={mById.get(c.mentorId)} locale={locale} t={t} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
