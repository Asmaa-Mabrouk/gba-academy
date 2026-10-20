"use client";
import Link from "next/link";
import { useState } from "react";
import { dateTime, num, tr } from "@/lib/i18n";
import { mentorApi } from "@/lib/mentor-api";
import { useAdmin } from "../admin/AdminShell";
import { errorText, useLoad } from "../admin/hooks";
import { PageTitle } from "../admin/ui";

export function MentorSessions() {
  const { locale, a, token } = useAdmin();
  const { data } = useLoad(() => mentorApi.sessions(token), [token]);
  const [err, setErr] = useState("");
  const join = async (id: string) => { try { window.open(await mentorApi.joinUrl(token, id), "_blank", "noopener"); } catch (e) { setErr(errorText(a, e)); } };
  const s = a.mp.sessions;
  return (
    <>
      <PageTitle>{a.mp.nav.sessions}</PageTitle>
      {err && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {!data ? <p className="text-mute">{a.common.loading}</p> : data.length === 0 ? <p className="card p-10 text-center text-mute">{s.empty}</p> : (
        <ul className="space-y-3">
          {data.map((x) => (
            <li key={x.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-navy text-gold-light">
                <span className="text-2xl font-black leading-none">{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", timeZone: "Asia/Riyadh" }).format(new Date(x.startsAt))}</span>
                <span className="text-[11px]">{new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { month: "short", timeZone: "Asia/Riyadh" }).format(new Date(x.startsAt))}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-navy">{tr(x.courseTitle, locale)}</p>
                <p className="text-sm text-mute">{tr(x.title, locale)} · {dateTime(x.startsAt, locale)} · {num(x.durationMin, locale)} {a.courses.minutes}</p>
              </div>
              <span className="chip bg-sand text-navy">{num(x.enrolled, locale)} / {num(x.seats, locale)} {s.enrolled}</span>
              <Link href={`/${locale}/mentor/courses/c-${x.courseSlug}`} className="text-sm font-bold text-navy hover:underline">{s.edit}</Link>
              <button className="btn btn-gold !py-2 text-sm" onClick={() => join(x.id)}>{s.join}</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
