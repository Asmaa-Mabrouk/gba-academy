import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { CourseCard } from "@/components/CourseCard";
import { Stars } from "@/components/Stars";
import { catalog } from "@/lib/api";
import { getDict, isLocale, num, tr } from "@/lib/i18n";

export default async function MentorPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const m = await catalog.mentor(slug);
  if (!m) notFound();
  const courses = (await catalog.courses()).filter((c) => c.mentorId === m.id);
  return (
    <>
      <section className="band py-14 text-navy">
        <div className="container-x flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Avatar name={tr(m.name, locale)} hue={m.hue} size={120} />
          <div>
            <h1 className="text-4xl font-black gold-text">{tr(m.name, locale)}</h1>
            <p className="mt-1 text-navy/70">{tr(m.title, locale)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm"><span className="flex items-center gap-2"><Stars value={m.rating} /> <b>{num(m.rating, locale)}</b> ({num(m.reviewCount, locale)})</span><span>{num(m.learners, locale)} {t.mentors.learners}</span><span>{num(courses.length, locale)} {t.mentors.courses}</span></div>
          </div>
        </div>
      </section>
      <div className="container-x py-10">
        <h2 className="text-2xl font-black text-navy">{t.mentors.about}</h2>
        <p className="mt-3 max-w-3xl leading-8">{tr(m.bio, locale)}</p>
        <div className="mt-4 flex flex-wrap gap-2">{m.expertise.map((e) => <span key={e} className="chip bg-sand text-navy">{e}</span>)}</div>
        <h2 className="mb-5 mt-12 text-2xl font-black text-navy">{t.mentors.coursesBy}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{courses.map((c) => <CourseCard key={c.id} course={c} mentor={m} locale={locale} t={t} />)}</div>
        <p className="mt-6 text-xs text-mute">{t.mentors.sampleNote}</p>
      </div>
    </>
  );
}
