"use client";
import { useState } from "react";
import { dateOnly, tr } from "@/lib/i18n";
import { mentorApi } from "@/lib/mentor-api";
import { Stars } from "../Stars";
import { useAdmin } from "../admin/AdminShell";
import { errorText, useLoad } from "../admin/hooks";
import { PageTitle } from "../admin/ui";

export function MentorReviews() {
  const { locale, a, token } = useAdmin();
  const { data, reload } = useLoad(() => mentorApi.reviews(token), [token]);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const run = async (fn: () => Promise<void>) => { try { await fn(); setErr(""); reload(); } catch (e) { setErr(errorText(a, e)); } };
  const t = a.reviews;
  return (
    <>
      <PageTitle>{a.mp.nav.reviews}</PageTitle>
      {err && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {!data ? <p className="text-mute">{a.common.loading}</p> : data.length === 0 ? <p className="card p-10 text-center text-mute">{a.mp.reviews.empty}</p> : (
        <ul className="space-y-4">
          {data.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><b className="text-navy">{r.author}</b> <span className="text-sm text-mute">· {tr(r.courseTitle, locale)} · {dateOnly(r.createdAt, locale)}</span></div><Stars value={r.rating} size={15} /></div>
              <p className="mt-2">{tr(r.comment, locale)}</p>
              {r.mentorReply ? (
                <div className="mt-3 rounded-xl border-s-4 border-gold bg-sand p-3 text-sm"><b>{t.reply}:</b> {tr(r.mentorReply, locale)}
                  <button className="ms-3 font-bold text-gold-deep hover:underline" onClick={() => run(() => mentorApi.replyReview(token, r.id, null))}>{t.clearReply}</button></div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input className="input" placeholder={t.writeReply} value={reply[r.id] ?? ""} onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })} />
                  <button className="btn btn-navy !py-2" disabled={!reply[r.id]?.trim()} onClick={() => run(async () => { const v = reply[r.id].trim(); await mentorApi.replyReview(token, r.id, { ar: v, en: v }); setReply({ ...reply, [r.id]: "" }); })}>{a.common.save}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
