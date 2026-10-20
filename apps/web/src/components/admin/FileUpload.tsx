"use client";
import { useRef, useState, type ReactNode } from "react";
import { UPLOAD_ACCEPT, uploadFile } from "@/lib/api";
import { notify } from "@/lib/toast";
import type { UploadedFile, UploadKind } from "@/lib/types";
import { useAdmin } from "./AdminShell";
import { errorText } from "./hooks";

/**
 * Upload button or drop zone for the editor. Calls `onDone` once per uploaded file. Shows progress, and reports a failure
 * inline and as a toast with the reason (too large, wrong type...). In mock mode small files are kept in the browser.
 */
export function FileUpload({ kind, onDone, multiple = false, variant = "button", label, hint, disabled = false, className = "" }: {
  kind: UploadKind; onDone: (f: UploadedFile) => void; multiple?: boolean; variant?: "button" | "zone"; label: ReactNode; hint?: string; disabled?: boolean; className?: string;
}) {
  const { a, token } = useAdmin();
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");

  const run = async (files: FileList | File[]) => {
    setErr("");
    for (const f of Array.from(files)) {
      try {
        setPct(0);
        onDone(await uploadFile(token, f, kind, setPct));
        notify.success(`${a.ed.uploaded}: ${f.name}`);
      } catch (e) {
        const m = errorText(a, e);
        setErr(m); notify.error(m);
        break;
      }
    }
    setPct(null);
    if (input.current) input.current.value = "";
  };
  const busy = pct !== null;
  const picker = <input ref={input} type="file" hidden accept={UPLOAD_ACCEPT[kind]} multiple={multiple} disabled={disabled || busy} onChange={(e) => e.target.files && run(e.target.files)} />;
  const bar = busy && (
    <div className="mt-3" role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-2 overflow-hidden rounded-full bg-navy/10"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} /></div>
      <p className="mt-1 text-xs text-mute">{a.ed.uploading} {pct}%</p>
    </div>
  );
  const error = err && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{err}</p>;

  if (variant === "zone")
    return (
      <div className={className}>
        <div
          role="button" tabIndex={0} aria-disabled={disabled || busy}
          className={`dropzone flex flex-col items-center justify-center gap-1 px-6 py-8 text-center ${over ? "dropzone-over" : ""} ${disabled ? "pointer-events-none opacity-60" : ""}`}
          onClick={() => !busy && input.current?.click()}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !busy) { e.preventDefault(); input.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy && e.dataTransfer.files.length) run(multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]]); }}
        >
          <span aria-hidden className="text-3xl">⬆</span>
          <b className="text-navy">{label}</b>
          {hint && <span className="text-xs text-mute">{hint}</span>}
        </div>
        {picker}{bar}{error}
      </div>
    );
  return (
    <div className={className}>
      <button type="button" className="btn btn-outline !py-2 text-sm" disabled={disabled || busy} onClick={() => input.current?.click()}>{busy ? `${a.ed.uploading} ${pct}%` : label}</button>
      {hint && <span className="ms-3 text-xs text-mute">{hint}</span>}
      {picker}{bar}{error}
    </div>
  );
}
