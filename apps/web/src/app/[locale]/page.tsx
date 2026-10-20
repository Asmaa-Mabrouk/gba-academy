import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CourseCard } from "@/components/CourseCard";
import { GpmfSpiral } from "@/components/GpmfSpiral";
import { Signature } from "@/components/Signature";
import { Stars } from "@/components/Stars";
import { catalog } from "@/lib/api";
import { dateTime, getDict, isLocale, num, tr } from "@/lib/i18n";
import { REVIEWS } from "@/lib/mock-data";
import { DRAFT_CONTENT, FOUNDER } from "@/lib/placeholders";
import type { Audience } from "@/lib/types";

const TRACKS: { id: Audience; bg: string; emoji: string }[] = [
  { id: "kids", bg: "from-teal to-sky text-navy", emoji: "✦" },
  { id: "youth", bg: "from-violet to-sky text-white", emoji: "➚" },
  { id: "experts", bg: "from-[#f3e6bf] to-[#d9bd77] text-navy", emoji: "◆" },
];

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const [courses, mentors] = await Promise.all([catalog.courses(), catalog.mentors()]);
  const mById = new Map(mentors.map((m) => [m.id, m]));
  const featured = courses.filter((c) => c.featured).concat(courses.filter((c) => !c.featured)).slice(0, 6);
  const live = courses
    .flatMap((c) => c.offerings.flatMap((o) => o.sessions.map((s) => ({ c, s }))))
    .filter((x) => new Date(x.s.startsAt) > new Date())
    .sort((a, b) => +new Date(a.s.startsAt) - +new Date(b.s.startsAt))
    .filter((x, i, arr) => arr.findIndex((y) => y.c.slug === x.c.slug) === i)
    .slice(0, 4);
  const L = (p: string) => `/${locale}${p}`;

  return (
    <>
      {/* HERO: slogan, founder photo + word, signature placeholder */}
      <section className="band relative overflow-hidden">
        <div className="pointer-events-none absolute -end-40 -top-32 opacity-[.22]" aria-hidden="true"><GpmfSpiral size={520} /></div>
        <div className="container-x relative grid items-center gap-10 pb-24 pt-12 lg:grid-cols-[1.1fr_.9fr] lg:pb-28 lg:pt-16">
          <div>
            <span className="chip rise border border-gold/50 bg-white/70 text-gold-deep">{t.hero.badge}</span>
            <h1 className="rise d1 mt-5 text-balance text-4xl font-black leading-[1.3] text-navy sm:text-5xl">{t.hero.slogan}</h1>
            <p className="rise d2 mt-5 max-w-xl text-lg leading-8 text-navy/70">{t.hero.sub}</p>
            <figure className="rise d3 card relative mt-8 max-w-xl p-6 ps-8">
              <span className="gold-bg absolute inset-y-6 start-0 w-1.5 rounded-full" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wide text-gold-deep">{t.hero.eyebrow}</p>
              <blockquote className="mt-2 text-lg font-medium leading-8 text-navy">“{t.hero.quote}”</blockquote>
              <figcaption className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <span><b className="block text-navy">{tr(FOUNDER.name, locale)}</b><span className="text-sm text-mute">{tr(FOUNDER.role, locale)}</span></span>
                <Signature label={t.hero.signature} image={FOUNDER.signatureImage} />
              </figcaption>
              {DRAFT_CONTENT && <p className="mt-3 text-xs text-gold-deep">{t.hero.draft}</p>}
            </figure>
            <div className="rise d4 mt-8 flex flex-wrap gap-3">
              <Link href={L("/courses")} className="btn btn-gold">{t.home.ctaPrimary}</Link>
              <Link href={L("/courses?mode=live")} className="btn btn-ghost">{t.home.ctaSecondary}</Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy/70">
              {t.home.trust.map((x) => <li key={x} className="flex items-center gap-2"><span className="text-gold-deep">✓</span>{x}</li>)}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[400px] rise d2">
            <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-br from-gold-light/60 via-transparent to-violet/20 blur-sm" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1b0f2b] shadow-2xl ring-1 ring-gold/40">
              <Image src={FOUNDER.photo} alt={tr(FOUNDER.name, locale)} width={498} height={912} priority className="h-auto w-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1b0f2b] via-[#1b0f2b]/80 to-transparent p-5 pt-14 text-white">
                <p className="text-lg font-black">{tr(FOUNDER.name, locale)}</p>
                <p className="text-sm text-white/75">{tr(FOUNDER.role, locale)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="container-x -mt-10 relative z-10 grid gap-5 md:grid-cols-3">
        {TRACKS.map((tr_, i) => (
          <Link key={tr_.id} href={L(`/courses?audience=${tr_.id}`)} className={`rise d${i + 1} group relative overflow-hidden rounded-3xl bg-gradient-to-br p-7 shadow-xl transition hover:-translate-y-1 ${tr_.bg}`}>
            <span className="absolute -end-6 -top-6 text-[9rem] leading-none opacity-15 transition group-hover:rotate-12">{tr_.emoji}</span>
            <span className="chip bg-white/25">{t.audiences[tr_.id].age}</span>
            <h2 className="mt-4 text-3xl font-black">{t.audiences[tr_.id].name}</h2>
            <p className="mt-2 max-w-xs text-[15px] leading-relaxed opacity-90">{t.audiences[tr_.id].blurb}</p>
            <span className="mt-5 inline-flex items-center gap-2 font-bold">{t.home.ctaPrimary} <span className="transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180">→</span></span>
          </Link>
        ))}
      </section>
      <p className="container-x mt-3 text-center text-xs text-mute">{t.home.parentNote}</p>

      {/* FEATURED */}
      <section className="container-x mt-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><h2 className="text-3xl font-black text-navy">{t.home.featuredTitle}</h2><p className="mt-1 text-mute">{t.home.tracksSubtitle}</p></div>
          <Link href={L("/courses")} className="font-bold text-gold-deep hover:underline">{t.common.viewAll} →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => <CourseCard key={c.id} course={c} mentor={mById.get(c.mentorId)} locale={locale} t={t} />)}
        </div>
      </section>

      {/* LIVE */}
      <section className="mt-20 bg-sand py-16">
        <div className="container-x">
          <h2 className="text-3xl font-black text-navy">{t.home.liveTitle}</h2>
          <p className="mt-1 text-mute">{t.home.liveSubtitle}</p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {live.map(({ c, s }) => (
              <Link key={s.id} href={L(`/courses/${c.slug}`)} className="card card-hover flex min-w-0 items-center gap-5 p-5">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-navy text-gold-light">
                  <span className="text-2xl font-black leading-none">{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", timeZone: "Asia/Riyadh" }).format(new Date(s.startsAt))}</span>
                  <span className="text-[11px]">{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { month: "short", timeZone: "Asia/Riyadh" }).format(new Date(s.startsAt))}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-navy">{tr(c.title, locale)}</p>
                  <p className="text-sm text-mute">{dateTime(s.startsAt, locale)} · {tr(mById.get(c.mentorId)!.name, locale)}</p>
                </div>
                <span className="chip bg-red-50 text-red-700">{num(s.seatsLeft, locale)} {t.common.seatsLeft}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MENTORS */}
      <section className="container-x mt-20">
        <h2 className="text-3xl font-black text-navy">{t.home.mentorsTitle}</h2>
        <p className="mt-1 text-mute">{t.home.mentorsSubtitle}</p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <Link key={m.id} href={L(`/mentors/${m.slug}`)} className="card card-hover flex min-w-0 items-center gap-4 p-5">
              <Avatar name={tr(m.name, locale)} hue={m.hue} size={64} />
              <div className="min-w-0">
                <p className="font-bold text-navy">{tr(m.name, locale)}</p>
                <p className="truncate text-sm text-mute">{tr(m.title, locale)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm"><Stars value={m.rating} size={13} /><b>{num(m.rating, locale)}</b><span className="text-mute">({num(m.reviewCount, locale)})</span></p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-mute">{t.mentors.sampleNote}</p>
      </section>

      {/* HOW */}
      <section className="mt-20 band py-16 text-navy">
        <div className="container-x">
          <h2 className="text-center text-3xl font-black gold-text">{t.home.howTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {t.home.how.map((h, i) => (
              <div key={h.t} className="relative rounded-3xl border border-navy/8 bg-white p-6 shadow-sm">
                <span className="gold-bg flex h-11 w-11 items-center justify-center rounded-full text-lg font-black text-navy">{num(i + 1, locale)}</span>
                <h3 className="mt-4 text-xl font-bold">{h.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy/70">{h.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="container-x mt-20">
        <h2 className="text-3xl font-black text-navy">{t.home.reviewsTitle}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {REVIEWS.filter((r) => r.rating === 5).slice(0, 3).map((r) => (
            <figure key={r.id} className="card p-6">
              <Stars value={r.rating} />
              <blockquote className="mt-3 leading-relaxed text-ink/90">“{tr(r.comment, locale)}”</blockquote>
              <figcaption className="mt-4 text-sm font-bold text-navy">{r.author}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-white to-cream-2 p-10 text-center text-navy shadow-xl md:p-16">
          <div className="pointer-events-none absolute -end-16 -top-16 opacity-25" aria-hidden="true"><GpmfSpiral size={320} /></div>
          <h2 className="relative text-3xl font-black md:text-4xl">{t.home.ctaBandTitle}</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-navy/70">{t.home.ctaBandText}</p>
          <Link href={L("/register")} className="btn btn-gold relative mt-7">{t.nav.register}</Link>
        </div>
      </section>
    </>
  );
}
