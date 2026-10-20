"use client";
import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { num } from "@/lib/i18n";
import { notify } from "@/lib/toast";
import type { PromoCode } from "@/lib/types";
import { useAdmin } from "./AdminShell";
import { errorText, failMsg, useLoad } from "./hooks";
import { Badge, Field, PageTitle, Panel, Table } from "./ui";

type Draft = { id?: string; code: string; percentOff: number; maxUses: string; expires: string; active: boolean; note: string };
const empty = (): Draft => ({ code: "", percentOff: 10, maxUses: "", expires: "", active: true, note: "" });
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generate = () => Array.from({ length: 8 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
/** Codes end at the end of the chosen day in Riyadh time (UTC+3). */
const endOfDay = (d: string) => new Date(`${d}T23:59:59+03:00`).toISOString();
const dayOf = (iso: string) => new Date(+new Date(iso) + 3 * 3600e3).toISOString().slice(0, 10);

export function AdminPromos() {
  const { locale, a, token } = useAdmin();
  const t = a.promos;
  const { data, reload } = useLoad(() => adminApi.promos(token), [token]);
  const [d, setD] = useState<Draft | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const status = (p: PromoCode) => (!p.active ? "inactive" : p.expired ? "expired" : p.maxUses != null && p.usedCount >= p.maxUses ? "exhausted" : "active") as keyof typeof t.statusNames;
  const tone = { active: "green", inactive: "sand", expired: "red", exhausted: "gold" } as const;

  const edit = (p: PromoCode) => { setMsg(null); setD({ id: p.id, code: p.code, percentOff: p.percentOff, maxUses: p.maxUses == null ? "" : String(p.maxUses), expires: p.expiresAt ? dayOf(p.expiresAt) : "", active: p.active, note: p.note ?? "" }); };
  const save = async () => {
    if (!d) return;
    setBusy(true); setMsg(null);
    try {
      await adminApi.savePromo(token, {
        id: d.id, code: d.code.trim().toUpperCase(), percentOff: d.percentOff,
        maxUses: d.maxUses === "" ? null : +d.maxUses, expiresAt: d.expires ? endOfDay(d.expires) : null, active: d.active, note: d.note.trim() || null,
      }, !d.id);
      notify.success(t.saved); setD(null); reload();
    } catch (e) { failMsg(setMsg, errorText(a, e)); }
    setBusy(false);
  };
  const remove = async (p: PromoCode) => {
    if (!confirm(t.deleteConfirm)) return;
    try { await adminApi.deletePromo(token, p.id); notify.success(t.deleted); reload(); } catch (e) { notify.error(errorText(a, e)); }
  };
  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); notify.success(t.copied); } catch { notify.warning(code); } };
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium", timeZone: "Asia/Riyadh" }).format(new Date(iso));

  return (
    <>
      <PageTitle actions={!d && <button className="btn btn-gold" onClick={() => { setMsg(null); setD({ ...empty(), code: generate() }); }}>+ {t.new}</button>}>{t.title}</PageTitle>
      <p className="mb-4 text-sm text-mute">{t.howTo}</p>

      {d && (
        <Panel title={d.id ? t.editTitle : t.newTitle} className="mb-6">
          {msg && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{msg.text}</p>}
          <div className="grid gap-4 md:grid-cols-4">
            <Field label={t.code} hint={t.codeHint}>
              <div className="flex gap-2">
                <input className="input font-mono uppercase" dir="ltr" value={d.code} disabled={!!d.id} maxLength={32} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} />
                {!d.id && <button type="button" className="btn btn-outline !px-3 text-sm" onClick={() => setD({ ...d, code: generate() })}>{t.generate}</button>}
              </div>
            </Field>
            <Field label={t.percent}><input className="input" type="number" min={1} max={100} dir="ltr" value={d.percentOff} onChange={(e) => setD({ ...d, percentOff: +e.target.value })} /></Field>
            <Field label={t.maxUses} hint={t.maxUsesHint}><input className="input" type="number" min={1} dir="ltr" placeholder={t.unlimited} value={d.maxUses} onChange={(e) => setD({ ...d, maxUses: e.target.value })} /></Field>
            <Field label={t.expires} hint={t.expiresHint}><input className="input" type="date" dir="ltr" value={d.expires} onChange={(e) => setD({ ...d, expires: e.target.value })} /></Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <Field label={`${t.note} (${a.common.optional})`}><input className="input" value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} /></Field>
            <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold text-navy"><input type="checkbox" className="accent-[#c49c3e]" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} />{t.active}</label>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? a.common.saving : a.common.save}</button>
            <button className="btn btn-outline" onClick={() => setD(null)}>{a.common.cancel}</button>
          </div>
        </Panel>
      )}

      {!data ? <p className="text-mute">{a.common.loading}</p> : data.length === 0 ? <p className="card p-10 text-center text-mute">{t.empty}</p> : (
        <Table head={[t.code, t.percent, t.used, t.expires, t.status, ""]}>
          {data.map((p) => {
            const s = status(p);
            return (
              <tr key={p.id} className="hover:bg-sand/40">
                <td className="px-4 py-3"><b className="font-mono text-navy" dir="ltr">{p.code}</b>{p.note && <div className="text-xs text-mute">{p.note}</div>}</td>
                <td className="px-4 py-3 font-bold">{num(p.percentOff, locale)}% {t.off}</td>
                <td className="px-4 py-3">{num(p.usedCount, locale)} / {p.maxUses == null ? t.unlimited : num(p.maxUses, locale)}</td>
                <td className="px-4 py-3">{p.expiresAt ? fmt(p.expiresAt) : t.never}</td>
                <td className="px-4 py-3"><Badge tone={tone[s]}>{t.statusNames[s]}</Badge></td>
                <td className="px-4 py-3 text-end whitespace-nowrap">
                  <button className="me-3 text-sm font-bold text-navy hover:underline" onClick={() => copy(p.code)}>{t.copy}</button>
                  <button className="me-3 text-sm font-bold text-navy hover:underline" onClick={() => edit(p)}>{a.common.edit}</button>
                  <button className="text-sm font-bold text-red-600 hover:underline" onClick={() => remove(p)}>{t.delete}</button>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
