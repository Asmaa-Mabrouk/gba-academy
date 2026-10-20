"use client";
import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { fileUrl } from "@/lib/api";
import { notify } from "@/lib/toast";
import type { Banner, BannerTheme } from "@/lib/types";
import { BannerSlide } from "../BannerSlider";
import { Bi } from "./Bi";
import { useAdmin } from "./AdminShell";
import { FileUpload } from "./FileUpload";
import { errorText, failMsg, useLoad } from "./hooks";
import { Badge, Field, PageTitle, Panel, Table } from "./ui";

const E = { ar: "", en: "" };
const blank = (order: number): Banner => ({ id: "", title: { ...E }, subtitle: { ...E }, ctaLabel: { ...E }, linkUrl: "", imageUrl: null, theme: "navy", startsAt: null, endsAt: null, active: true, sortOrder: order });
// Dates are typed in Riyadh time (UTC+3) and stored in UTC.
const toInput = (iso: string | null) => (iso ? new Date(+new Date(iso) + 3 * 3600e3).toISOString().slice(0, 16) : "");
const fromInput = (v: string) => (v ? new Date(`${v}:00+03:00`).toISOString() : null);

export function AdminBanners() {
  const { locale, a, token } = useAdmin();
  const t = a.banners;
  const { data, reload } = useLoad(() => adminApi.banners(token), [token]);
  const [d, setD] = useState<Banner | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const status = (b: Banner) => (!b.active ? "off" : b.startsAt && +new Date(b.startsAt) > now ? "scheduled" : b.endsAt && +new Date(b.endsAt) <= now ? "ended" : "live") as keyof typeof t.statusNames;
  const tone = { live: "green", scheduled: "gold", ended: "red", off: "sand" } as const;

  const save = async () => {
    if (!d) return;
    setBusy(true); setMsg(null);
    try {
      await adminApi.saveBanner(token, { ...d, linkUrl: d.linkUrl?.trim() || null }, !d.id);
      notify.success(t.saved); setD(null); reload();
    } catch (e) { failMsg(setMsg, errorText(a, e)); }
    setBusy(false);
  };
  const remove = async (b: Banner) => {
    if (!confirm(t.deleteConfirm)) return;
    try { await adminApi.deleteBanner(token, b.id); notify.success(t.deleted); reload(); } catch (e) { notify.error(errorText(a, e)); }
  };
  const fmt = (iso: string | null) => (iso ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(iso)) : "-");

  return (
    <>
      <PageTitle actions={!d && <button className="btn btn-gold" onClick={() => { setMsg(null); setD(blank((data?.length ?? 0) + 1)); }}>+ {t.new}</button>}>{t.title}</PageTitle>
      <p className="mb-4 text-sm text-mute">{t.howTo}</p>

      {d && (
        <Panel title={d.id ? t.editTitle : t.newTitle} className="mb-6">
          {msg && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{msg.text}</p>}
          <div className="space-y-4">
            <Bi a={a.common} label={t.titleField} value={d.title} onChange={(v) => setD({ ...d, title: v })} />
            <Bi a={a.common} label={t.subtitleField} value={d.subtitle} onChange={(v) => setD({ ...d, subtitle: v })} />
            <Bi a={a.common} label={t.cta} value={d.ctaLabel} onChange={(v) => setD({ ...d, ctaLabel: v })} />
            <div className="grid gap-4 md:grid-cols-[2fr_1fr_100px]">
              <Field label={t.link} hint={t.linkHint}><input className="input" dir="ltr" placeholder="https://gpmf.world" value={d.linkUrl ?? ""} onChange={(e) => setD({ ...d, linkUrl: e.target.value })} /></Field>
              <Field label={t.theme}><select className="input" value={d.theme} onChange={(e) => setD({ ...d, theme: e.target.value as BannerTheme })}>{Object.entries(t.themes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
              <Field label={t.order} hint={t.orderHint}><input className="input" type="number" dir="ltr" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: +e.target.value })} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label={t.starts}><input className="input" type="datetime-local" dir="ltr" value={toInput(d.startsAt)} onChange={(e) => setD({ ...d, startsAt: fromInput(e.target.value) })} /></Field>
              <Field label={t.ends} hint={t.windowHint}><input className="input" type="datetime-local" dir="ltr" value={toInput(d.endsAt)} onChange={(e) => setD({ ...d, endsAt: fromInput(e.target.value) })} /></Field>
              <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold text-navy"><input type="checkbox" className="accent-[#c49c3e]" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} />{t.active}</label>
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-bold text-navy">{t.image}</span>
              <div className="flex flex-wrap items-center gap-3">
                <FileUpload kind="image" label={t.upload} onDone={(f) => setD({ ...d, imageUrl: f.url })} />
                {d.imageUrl && <><span className="text-xs text-mute" dir="ltr">{d.imageUrl.startsWith("data:") ? "image" : fileUrl(d.imageUrl).slice(-28)}</span><button type="button" className="text-sm font-bold text-red-600 hover:underline" onClick={() => setD({ ...d, imageUrl: null })}>{t.removeImage}</button></>}
              </div>
              <p className="mt-1 text-xs text-mute">{t.imageHint}</p>
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-bold text-navy">{t.preview}</span>
              <div className="h-36 overflow-hidden rounded-2xl sm:h-32"><BannerSlide b={d} locale={locale} /></div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? a.common.saving : a.common.save}</button>
            <button className="btn btn-outline" onClick={() => setD(null)}>{a.common.cancel}</button>
          </div>
        </Panel>
      )}

      {!data ? <p className="text-mute">{a.common.loading}</p> : data.length === 0 ? <p className="card p-10 text-center text-mute">{t.empty}</p> : (
        <Table head={[t.order, t.titleField, t.link, t.starts, t.ends, t.status, ""]}>
          {data.map((b) => {
            const s = status(b);
            return (
              <tr key={b.id} className="hover:bg-sand/40">
                <td className="px-4 py-3 font-bold">{b.sortOrder}</td>
                <td className="px-4 py-3 font-bold text-navy">{b.title[locale]}</td>
                <td className="px-4 py-3 text-xs" dir="ltr">{b.linkUrl ?? "-"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs">{fmt(b.startsAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs">{fmt(b.endsAt)}</td>
                <td className="px-4 py-3"><Badge tone={tone[s]}>{t.statusNames[s]}</Badge></td>
                <td className="px-4 py-3 text-end whitespace-nowrap">
                  <button className="me-3 text-sm font-bold text-navy hover:underline" onClick={() => { setMsg(null); setD(b); }}>{a.common.edit}</button>
                  <button className="text-sm font-bold text-red-600 hover:underline" onClick={() => remove(b)}>{a.common.remove}</button>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
