import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CourseCard } from "@/components/CourseCard";
import { GpmfSpiral } from "@/components/GpmfSpiral";
import { Stars } from "@/components/Stars";
import { catalog } from "@/lib/api";
import { dateTime, getDict, isLocale, num, tr } from "@/lib/i18n";
import { REVIEWS } from "@/lib/mock-data";
import type { Audience } from "@/lib/types";

const TRACKS: { id: Audience; bg: string; emoji: string }[] = [
  { id: "kids", bg: "from-teal to-sky text-navy", emoji: "✦" },
  { id: "youth", bg: "from-violet to-sky text-white", emoji: "➚" },
  { id: "experts", bg: "from-navy-2 to-navy-3 text-white", emoji: "◆" },
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
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 60% at 80% 30%, rgb(196 156 62 / .22), transparent 70%), radial-gradient(40% 50% at 10% 90%, rgb(167 89 209 / .18), transparent 70%)" }} />
        <div className="container-x relative grid items-center gap-10 py-16 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div>
            <span className="chip rise border border-gold/40 bg-white/5 text-gold-light">{t.home.eyebrow}</span>
            <h1 className="rise d1 mt-5 text-4xl font-black leading-[1.25] sm:text-5xl lg:text-6xl">{t.home.title}</h1>
            <p className="rise d2 mt-5 max-w-xl text-lg leading-relaxed text-white/75">{t.home.subtitle}</p>
            <div className="rise d3 mt-8 flex flex-wrap gap-3">
              <Link href={L("/courses")} className="btn btn-gold">{t.home.ctaPrimary}</Link>
              <Link href={L("/courses?mode=live")} className="btn btn-ghost">{t.home.ctaSecondary}</Link>
            </div>
            <ul className="rise d4 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {t.home.trust.map((x) => <li key={x} className="flex items-center gap-2"><span className="text-gold">✓</span>{x}</li>)}
            </ul>
          </div>
          <div className="relative mx-auto hidden lg:block"><GpmfSpiral size={420} /></div>
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
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {live.map(({ c, s }) => (
              <Link key={s.id} href={L(`/courses/${c.slug}`)} className="card card-hover flex items-center gap-5 p-5">
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
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <Link key={m.id} href={L(`/mentors/${m.slug}`)} className="card card-hover flex items-center gap-4 p-5">
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
      <section className="mt-20 bg-navy py-16 text-white">
        <div className="container-x">
          <h2 className="text-center text-3xl font-black gold-text">{t.home.howTitle}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {t.home.how.map((h, i) => (
              <div key={h.t} className="relative rounded-3xl border border-white/10 bg-white/5 p-6">
                <span className="gold-bg flex h-11 w-11 items-center justify-center rounded-full text-lg font-black text-navy">{num(i + 1, locale)}</span>
                <h3 className="mt-4 text-xl font-bold">{h.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{h.d}</p>
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
        <div className="relative overflow-hidden rounded-[2rem] bg-navy p-10 text-center text-white md:p-16">
          <GpmfSpiral size={320} className="pointer-events-none absolute -end-16 -top-16 opacity-25" />
          <h2 className="relative text-3xl font-black md:text-4xl">{t.home.ctaBandTitle}</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/75">{t.home.ctaBandText}</p>
          <Link href={L("/register")} className="btn btn-gold relative mt-7">{t.nav.register}</Link>
        </div>
      </section>
    </>
  );
}
