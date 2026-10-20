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
      {/* HERO: luxury layout. Slogan, founder word, arch-framed portrait, glass nameplate. */}
      <section className="luxe-hero relative overflow-hidden">
        <div className="pointer-events-none absolute -end-48 top-1/2 -translate-y-1/2 opacity-[.16]" aria-hidden="true"><GpmfSpiral size={640} /></div>
        <div className="container-x relative grid items-center gap-12 pb-28 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:pb-32 lg:pt-14">
          <div>
            <span className="rise inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/70 px-4 py-1.5 text-xs font-bold tracking-wide text-gold-deep shadow-sm backdrop-blur">
              <span className="gold-bg h-2 w-2 rounded-full" aria-hidden="true" />{t.hero.badge}
            </span>
            <h1 className="rise d1 mt-6 text-balance text-5xl font-black leading-[1.25] text-navy lg:text-[3.6rem]">
              {t.hero.slogan.split(". ")[0]}.<br /><span className="gold-text">{t.hero.slogan.split(". ")[1]}</span>
            </h1>
            <div className="rise d1 mt-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px w-20 bg-gradient-to-r from-gold to-transparent rtl:bg-gradient-to-l" /><span className="gold-bg h-2.5 w-2.5 rotate-45" /><span className="h-px w-8 bg-gold/40" />
            </div>
            <p className="rise d2 mt-5 max-w-xl text-lg leading-8 text-navy/70">{t.hero.sub}</p>
            <figure className="rise d3 relative mt-8 max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white/65 p-7 ps-9 shadow-[0_30px_60px_-30px_rgba(109,60,7,.35)] backdrop-blur-xl">
              <span className="gold-bg absolute inset-y-0 start-0 w-1.5" aria-hidden="true" />
              <span className="gold-text pointer-events-none absolute -top-2 end-5 select-none font-serif text-[7rem] leading-none opacity-30" aria-hidden="true">”</span>
              <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-gold-deep">{t.hero.eyebrow}</p>
              <blockquote className="relative mt-3 text-[1.15rem] font-medium leading-9 text-navy">{t.hero.quote}</blockquote>
              <figcaption className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-gold/25 pt-4">
                <span><b className="block text-navy">{tr(FOUNDER.name, locale)}</b><span className="text-sm text-mute">{tr(FOUNDER.role, locale)}</span></span>
                <Signature label={t.hero.signature} image={FOUNDER.signatureImage} name={FOUNDER.name.en} />
              </figcaption>
              {DRAFT_CONTENT && <p className="mt-3 text-xs text-gold-deep">{t.hero.draft}</p>}
            </figure>
            <div className="rise d4 mt-8 flex flex-wrap gap-3">
              <Link href={L("/courses")} className="btn btn-gold btn-shine !px-8 !py-3.5 text-base">{t.home.ctaPrimary}</Link>
              <Link href={L("/courses?mode=live")} className="btn btn-ghost !px-7 !py-3.5 bg-white/50 backdrop-blur">{t.home.ctaSecondary}</Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy/75">
              {t.home.trust.map((x) => <li key={x} className="flex items-center gap-2"><span className="gold-bg flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-navy">✓</span>{x}</li>)}
            </ul>
          </div>

          <div className="rise d2 relative mx-auto w-full max-w-[470px]">
            <div className="absolute inset-x-0 bottom-10 top-28 rounded-full bg-gradient-to-b from-gold-light/60 via-gold/15 to-transparent blur-3xl" aria-hidden="true" />
            {/* double arch frame */}
            <div className="absolute inset-x-0 bottom-0 top-20 rounded-t-[999px] border border-b-0 border-gold/30" aria-hidden="true" />
            <div className="absolute inset-x-5 bottom-0 top-28 rounded-t-[999px] p-[2px]" style={{ background: "linear-gradient(165deg,#edca6d,#c49c3e 45%,rgba(196,156,62,.12))" }} aria-hidden="true">
              <div className="h-full w-full rounded-t-[999px]" style={{ background: "radial-gradient(80% 60% at 50% 20%, #fffdf7, #f6efdc 70%, #efe4c8)" }} />
            </div>
            <Image src={FOUNDER.photo} alt={tr(FOUNDER.name, locale)} width={1000} height={1402} priority sizes="(min-width:1024px) 470px, 90vw"
              className="relative z-10 h-auto w-full drop-shadow-[0_28px_30px_rgba(109,60,7,.22)]" style={{ maskImage: "linear-gradient(to bottom,#000 88%,transparent), linear-gradient(to right,transparent,#000 7%,#000 93%,transparent)", maskComposite: "intersect", WebkitMaskComposite: "source-in" }} />
            {/* floating glass chips */}
            <div className="animate-float absolute start-0 top-40 z-20 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 text-xs font-bold text-navy shadow-xl backdrop-blur-md">
              <span className="gold-bg flex h-6 w-6 items-center justify-center rounded-full text-[11px] text-navy">★</span>{t.home.trust[0]}
            </div>
            <div className="absolute end-0 top-[58%] z-20 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 text-xs font-bold text-navy shadow-xl backdrop-blur-md" style={{ animation: "float 8s ease-in-out 1s infinite" }}>
              <span className="gold-bg flex h-6 w-6 items-center justify-center rounded-full text-[11px] text-navy">🎓</span>{t.home.trust[1]}
            </div>
            {/* nameplate */}
            <div className="absolute inset-x-6 bottom-0 z-20 translate-y-1/2 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_24px_50px_-18px_rgba(11,19,39,.35)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <img src="/brand/gpmf-flower-256.png" alt="" width={40} height={40} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="font-black text-navy">{tr(FOUNDER.name, locale)}</p>
                  <p className="truncate text-xs text-mute">{tr(FOUNDER.role, locale)}</p>
                </div>
              </div>
              <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
            </div>
          </div>
        </div>
        <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" aria-hidden="true" />
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
              <Avatar name={tr(m.name, locale)} hue={m.hue} size={64} imageUrl={m.imageUrl} />
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
