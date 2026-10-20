"use client";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { dateOnly, num, tr, type Dict } from "@/lib/i18n";
import { useAuth } from "@/lib/store";
import type { Locale, Review } from "@/lib/types";
import { Stars } from "./Stars";

export function Reviews({ slug, base, rating, count, locale, t }: { slug: string; base: Review[]; rating: number; count: number; locale: Locale; t: Dict }) {
  const { user, token } = useAuth();
  const [extra, setExtra] = useState<Review[]>([]);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { userApi.extraReviews(slug).then(setExtra).catch(() => {}); }, [slug]);
  const all = [...extra, ...base];
  const submit = async () => {
    if (!token || !user || !text.trim()) return;
    try {
      const r = await userApi.addReview(token, slug, stars, text.trim(), user.fullName);
      setExtra((e) => [r, ...e]); setText(""); setMsg("");
    } catch { setMsg(t.course.reviewHint); }
  };
  return (
    <section>
      <h2 className="text-2xl font-black text-navy">{t.course.reviews}</h2>
      <div className="mt-3 flex items-center gap-3"><span className="text-5xl font-black text-gold-deep">{num(rating, locale)}</span><div><Stars value={rating} size={20} /><p className="text-sm text-mute">{num(count, locale)} {t.common.reviews}</p></div></div>
      <ul className="mt-6 space-y-4">
        {all.map((r) => (
          <li key={r.id} className="card p-5">
            <div className="flex items-center justify-between"><b className="text-navy">{r.author}</b><span className="text-xs text-mute">{dateOnly(r.createdAt, locale)}</span></div>
            <div className="mt-1"><Stars value={r.rating} size={14} /></div>
            <p className="mt-2 leading-relaxed">{tr(r.comment, locale)}</p>
            {r.mentorReply && <div className="mt-3 rounded-xl border-s-4 border-gold bg-sand p-3 text-sm"><b>{t.course.mentorReply}:</b> {tr(r.mentorReply, locale)}</div>}
          </li>
        ))}
      </ul>
      {user && (
        <div className="card mt-6 p-5">
          <h3 className="font-bold text-navy">{t.course.writeReview}</h3>
          <div className="my-2 flex items-center gap-1" role="radiogroup" aria-label={t.course.yourRating}>
            {[1, 2, 3, 4, 5].map((i) => <button key={i} onClick={() => setStars(i)} aria-label={`${i}`} className={`text-3xl ${i <= stars ? "text-gold" : "text-navy/15"}`}>★</button>)}
          </div>
          <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.course.yourComment} />
          <div className="mt-3 flex items-center gap-3"><button className="btn btn-navy" onClick={submit}>{t.course.submit}</button><span className="text-sm text-mute">{msg || t.course.reviewHint}</span></div>
        </div>
      )}
    </section>
  );
}
