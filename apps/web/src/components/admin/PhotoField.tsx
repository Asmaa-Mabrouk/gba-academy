"use client";
import { Avatar } from "../Avatar";
import { useAdmin } from "./AdminShell";
import { FileUpload } from "./FileUpload";

/** Mentor photo: preview, upload or change, remove. Used by the admin (any mentor) and by the mentor (own profile). */
export function PhotoField({ name, hue, value, onChange }: { name: string; hue: number; value?: string | null; onChange: (url: string | null) => void }) {
  const { a } = useAdmin();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar name={name || "?"} hue={hue} size={80} imageUrl={value} />
      <div>
        <span className="mb-1 block text-sm font-bold text-navy">{a.ed.mentorPhoto}</span>
        <div className="flex flex-wrap items-center gap-3">
          <FileUpload kind="image" label={value ? a.ed.photoChange : a.ed.photoUpload} onDone={(f) => onChange(f.url)} />
          {value && <button type="button" className="text-sm font-bold text-red-600 hover:underline" onClick={() => onChange(null)}>{a.ed.photoRemove}</button>}
        </div>
        <p className="mt-1 text-xs text-mute">{a.ed.photoHint}</p>
      </div>
    </div>
  );
}
