import Link from "next/link";
import { minPrice } from "@/lib/api";
import { money, num, tr, type Dict } from "@/lib/i18n";
import type { Course, Locale, Mentor } from "@/lib/types";
import { CourseCover } from "./CourseCover";
import { Stars } from "./Stars";

const AUD_COLOR = { kids: "bg-teal text-navy", youth: "bg-violet text-white", experts: "bg-navy text-gold-light" } as const;

export function CourseCard({ course, mentor, locale, t }: { course: Course; mentor?: Mentor; locale: Locale; t: Dict }) {
  const price = minPrice(course);
  const modes = Array.from(new Set(course.offerings.map((o) => o.mode)));
  return (
    <Link href={`/${locale}/courses/${course.slug}`} className="card card-hover group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[5/3] overflow-hidden">
        <CourseCover slug={course.slug} audience={course.audience} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute start-3 top-3 flex gap-2">
          <span className={`chip ${AUD_COLOR[course.audience]}`}>{t.audiences[course.audience].name}</span>
          {course.isNew && <span className="chip bg-white text-navy">{t.common.new}</span>}
          {course.bestseller && <span className="chip gold-bg text-navy">{t.common.bestseller}</span>}
        </div>
        {modes.includes("live") || modes.includes("blended") ? (
          <span className="chip absolute bottom-3 start-3 bg-red-600 text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />{t.modes.live}</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-navy">{tr(course.title, locale)}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-mute">{tr(course.subtitle, locale)}</p>
        {mentor && <p className="mt-3 text-sm font-medium text-ink/80">{tr(mentor.name, locale)}</p>}
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="font-bold text-gold-deep">{num(course.rating, locale)}</span>
          <Stars value={course.rating} size={14} />
          <span className="text-mute">({num(course.reviewCount, locale)})</span>
        </div>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div className="text-xs text-mute">{num(course.hours, locale)} {t.common.hours}{course.ageRange ? ` · ${course.ageRange}` : ""}</div>
          <div className="text-end">
            {course.offerings.length > 1 && price > 0 && <div className="text-[11px] text-mute">{locale === "ar" ? "يبدأ من" : "from"}</div>}
            <div className="text-xl font-extrabold text-navy">{money(price, locale)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
