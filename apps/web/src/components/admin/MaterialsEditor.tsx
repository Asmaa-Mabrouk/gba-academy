"use client";
import { useState } from "react";
import { fileUrl } from "@/lib/api";
import type { Material } from "@/lib/types";
import { useAdmin } from "./AdminShell";
import { FileUpload } from "./FileUpload";

const uid = () => `f-${Math.random().toString(36).slice(2, 10)}`;
const icon = (n: string) => (/\.pdf$/i.test(n) ? "📕" : /\.(pptx?|key)$/i.test(n) ? "📙" : /\.(xlsx?|csv)$/i.test(n) ? "📗" : /\.(docx?)$/i.test(n) ? "📘" : "📎");
export const sizeText = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b > 0 ? `${Math.max(1, Math.round(b / 1024))} KB` : "");

/** Attach PDFs, slides and documents (uploaded) or links to a course or a lesson. */
export function MaterialsEditor({ items, onChange, disabled = false }: { items: Material[]; onChange: (m: Material[]) => void; disabled?: boolean }) {
  const { a, token } = useAdmin();
  const [link, setLink] = useState({ name: "", url: "" });
  const t = a.ed;
  const addLink = () => {
    const url = link.url.trim();
    if (!/^https:\/\/\S+$/.test(url)) return;
    onChange([...items, { id: uid(), name: link.name.trim() || url, url, size: 0 }]);
    setLink({ name: "", url: "" });
  };
  return (
    <div className="space-y-3">
      {items.length === 0 ? <p className="rounded-xl bg-sand/60 p-3 text-sm text-mute">{t.noFiles}</p> : (
        <ul className="space-y-2">
          {items.map((m, i) => (
            <li key={m.id} className="flex items-center gap-2 rounded-xl border border-navy/10 bg-white p-2">
              <span aria-hidden className="text-xl">{icon(m.name)}</span>
              <input className="input !py-2" aria-label={t.fileName} value={m.name} disabled={disabled} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <span className="whitespace-nowrap text-xs text-mute" dir="ltr">{sizeText(m.size)}</span>
              <a href={fileUrl(m.url, token)} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-navy hover:underline">↗</a>
              <button type="button" className="px-2 text-red-600" disabled={disabled} aria-label={a.common.remove} onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      <FileUpload kind="document" multiple disabled={disabled} label={`+ ${t.upload}`} hint={t.docHint} onDone={(f) => onChange([...items, { id: uid(), name: f.name, url: f.url, size: f.size }])} />
      <div className="flex flex-wrap items-end gap-2">
        <input className="input max-w-[200px] !py-2" placeholder={t.fileName} disabled={disabled} value={link.name} onChange={(e) => setLink({ ...link, name: e.target.value })} />
        <input className="input max-w-sm !py-2" dir="ltr" placeholder="https://…" aria-label={t.linkUrl} disabled={disabled} value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} />
        <button type="button" className="btn btn-outline !py-2 text-sm" disabled={disabled || !/^https:\/\/\S+$/.test(link.url.trim())} onClick={addLink}>{t.addLink}</button>
      </div>
    </div>
  );
}
