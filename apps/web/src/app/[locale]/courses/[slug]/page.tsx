import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { BuyBox } from "@/components/BuyBox";
import { CourseCard } from "@/components/CourseCard";
import { CourseCover } from "@/components/CourseCover";
import { Reviews } from "@/components/Reviews";
import { Stars } from "@/components/Stars";
import { catalog } from "@/lib/api";
import { getDict, isLocale, num, tr } from "@/lib/i18n";

const KIND_ICON = { video: "▶", live: "●", quiz: "✎", resource: "⬇" } as const;

export default async function CoursePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const course = await catalog.course(slug);
  if (!course) notFound();
  const t = getDict(locale);
  const [mentors, reviews, all] = await Promise.all([catalog.mentors(), catalog.reviews(slug), catalog.courses({ audience: course.audience })]);
  const mentor = mentors.find((m) => m.id === course.mentorId)!;
  const related = all.filter((c) => c.slug !== slug).slice(0, 3);
  const lessonCount = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <>
      <section className="relative overflow-hidden band text-navy">
        <CourseCover slug={course.slug} audience={course.audience} className="absolute inset-0 h-full w-full opacity-[.12]" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/30 to-cream-2/80" />
        <div className="container-x relative py-14 lg:pe-[400px]">
          <nav className="text-sm text-navy/60"><Link href={`/${locale}/courses`} className="hover:text-gold-deep">{t.nav.courses}</Link> / {t.audiences[course.audience].name}</nav>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{tr(course.title, locale)}</h1>
          <p className="mt-3 max-w-2xl text-lg text-navy/75">{tr(course.subtitle, locale)}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-2"><b className="text-gold-deep">{num(course.rating, locale)}</b><Stars value={course.rating} size={15} />({num(course.reviewCount, locale)})</span>
            <span>{num(course.learners, locale)} {t.common.learners}</span>
            <span>{num(course.hours, locale)} {t.common.hours}</span>
            <span>{t.levels[course.level]}</span>
            <span>{t.course.languages}: {course.languages.map((l) => (l === "ar" ? "العربية" : "English")).join(" · ")}</span>
          </div>
          <Link href={`/${locale}/mentors/${mentor.slug}`} className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/10 py-1.5 pe-5 ps-1.5 hover:bg-white/15">
            <Avatar name={tr(mentor.name, locale)} hue={mentor.hue} size={38} /><span className="font-medium">{tr(mentor.name, locale)}</span>
          </Link>
        </div>
      </section>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-12 min-w-0">
          <section>
            <h2 className="text-2xl font-black text-navy">{t.course.whatYouLearn}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o, i) => <li key={i} className="flex gap-3 rounded-2xl bg-sand p-4"><span className="text-gold-deep">✓</span>{tr(o, locale)}</li>)}
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-black text-navy">{t.course.about}</h2>
            <p className="mt-3 leading-8 text-ink/85">{tr(course.description, locale)}</p>
          </section>
          <section>
            <h2 className="text-2xl font-black text-navy">{t.course.syllabus}</h2>
            <p className="text-sm text-mute">{num(lessonCount, locale)} {t.course.lessons}</p>
            <div className="mt-4 space-y-3">
              {course.modules.map((m, i) => (
                <details key={m.id} className="card group overflow-hidden" open={i === 0}>
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-bold text-navy"><span>{tr(m.title, locale)}</span><span className="text-xs font-medium text-mute">{num(m.lessons.length, locale)} {t.course.lessons}</span></summary>
                  <ul className="divide-y divide-navy/5 border-t border-navy/5">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                        <span className={l.kind === "live" ? "text-red-600" : "text-gold-deep"}>{KIND_ICON[l.kind]}</span>
                        <span className="flex-1">{tr(l.title, locale)}</span>
                        {l.preview && <span className="chip bg-teal/30 text-navy">{t.course.preview}</span>}
                        <span className="text-mute">{num(l.minutes, locale)} {t.course.minutes}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
          <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <Avatar name={tr(mentor.name, locale)} hue={mentor.hue} size={80} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gold-deep">{t.course.mentor}</p>
              <h3 className="text-xl font-black text-navy">{tr(mentor.name, locale)}</h3>
              <p className="text-sm text-mute">{tr(mentor.title, locale)}</p>
              <p className="mt-2 text-sm leading-relaxed">{tr(mentor.bio, locale)}</p>
              <Link href={`/${locale}/mentors/${mentor.slug}`} className="mt-2 inline-block text-sm font-bold text-gold-deep hover:underline">{t.course.viewProfile} →</Link>
            </div>
          </section>
          <Reviews slug={slug} base={reviews} rating={course.rating} count={course.reviewCount} locale={locale} t={t} />
        </div>
        <aside className="order-first lg:order-none lg:-mt-52 lg:self-start lg:sticky lg:top-24 relative z-10">
          <BuyBox course={course} locale={locale} t={t} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-x mt-6">
          <h2 className="mb-5 text-2xl font-black text-navy">{t.course.related}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map((c) => <CourseCard key={c.id} course={c} mentor={mentors.find((m) => m.id === c.mentorId)} locale={locale} t={t} />)}</div>
        </section>
      )}
    </>
  );
}
