import { fileUrl } from "@/lib/api";

/** Round avatar: the uploaded photo when there is one, otherwise coloured initials. */
export function Avatar({ name, hue, size = 56, imageUrl }: { name: string; hue: number; size?: number; imageUrl?: string | null }) {
  const initials = name.replace(/^د\.\s*|^Dr\.\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("");
  const ring = "0 0 0 3px #fff, 0 0 0 5px rgb(196 156 62 / .6)";
  if (imageUrl)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fileUrl(imageUrl)} alt="" width={size} height={size} loading="lazy" className="inline-block shrink-0 rounded-full bg-sand object-cover" style={{ width: size, height: size, boxShadow: ring }} />
    );
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-inner"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 30%))`, boxShadow: ring }}
      aria-hidden="true"
    >{initials}</span>
  );
}
