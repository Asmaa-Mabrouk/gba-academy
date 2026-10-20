import type { Audience } from "@/lib/types";

const PAL: Record<Audience, [string, string, string]> = {
  kids: ["#7fc9bf", "#78afd4", "#edca6d"],
  youth: ["#a759d1", "#78afd4", "#edca6d"],
  experts: ["#0b1327", "#1a2547", "#c49c3e"],
};

/** Generative cover so every course has artwork before real images exist. */
export function CourseCover({ slug, audience, className = "" }: { slug: string; audience: Audience; className?: string }) {
  const [a, b, c] = PAL[audience];
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = (n: number) => ((h >> n) & 63) / 63;
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g-${slug}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#g-${slug})`} />
      {audience === "kids" && [0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={40 + r(i * 3) * 320} cy={30 + r(i * 5 + 1) * 180} r={18 + r(i * 2) * 38} fill={i % 2 ? c : "#fff"} opacity={0.35 + (i % 3) * 0.12} />
      ))}
      {audience === "youth" && [0, 1, 2, 3].map((i) => (
        <rect key={i} x={30 + r(i * 3) * 280} y={20 + r(i * 7) * 130} width={70 + r(i) * 80} height={70 + r(i + 2) * 80} rx="22" fill={i % 2 ? c : "#fff"} opacity={0.3 + i * 0.08} transform={`rotate(${r(i * 4) * 50 - 25} 200 120)`} />
      ))}
      {audience === "experts" && [0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M-10 ${40 + i * 34} C 100 ${r(i) * 120 + 20}, 260 ${r(i + 3) * 240}, 420 ${30 + i * 36}`} stroke={c} strokeWidth="1.5" fill="none" opacity={0.25 + i * 0.1} />
      ))}
      <circle cx="330" cy="50" r="46" fill={c} opacity=".18" />
    </svg>
  );
}
