import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import { catalog } from "@/lib/api";
import { getDict, isLocale, num, tr } from "@/lib/i18n";

export default async function Mentors({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const mentors = await catalog.mentors();
  return (
    <>
      <section className="band py-12 text-navy"><div className="container-x"><h1 className="text-4xl font-black gold-text">{t.mentors.title}</h1><p className="mt-2 text-navy/70">{t.mentors.subtitle}</p></div></section>
      <div className="container-x grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {mentors.map((m) => (
          <Link key={m.id} href={`/${locale}/mentors/${m.slug}`} className="card card-hover p-6">
            <Avatar name={tr(m.name, locale)} hue={m.hue} size={84} imageUrl={m.imageUrl} />
            <h2 className="mt-4 text-xl font-black text-navy">{tr(m.name, locale)}</h2>
            <p className="text-sm text-mute">{tr(m.title, locale)}</p>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{tr(m.bio, locale)}</p>
            <div className="mt-4 flex items-center justify-between text-sm"><span className="flex items-center gap-1.5"><Stars value={m.rating} size={14} /><b>{num(m.rating, locale)}</b></span><span className="text-mute">{num(m.learners, locale)} {t.mentors.learners}</span></div>
          </Link>
        ))}
      </div>
      <p className="container-x text-xs text-mute">{t.mentors.sampleNote}</p>
    </>
  );
}
