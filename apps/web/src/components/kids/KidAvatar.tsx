/** Original cartoon hero, drawn in SVG from a small set of choices. Stores no personal data: only the choices. */
export type HeroLook = { skin: number; hair: "none" | "short" | "spiky" | "curly" | "bun"; hairColor: number; outfit: number; accessory: "none" | "glasses" | "crown" | "star" | "headphones"; bg: number; cape: boolean };

export const SKINS = ["#f6d5b8", "#e8b98d", "#c68b59", "#8d5a3b", "#5b3a29", "#fbe3cf"];
export const HAIRS = ["#2b1b12", "#6b3f1d", "#c9852b", "#d94b3f", "#7a4fd1", "#2f7fd1"];
export const OUTFITS = ["#c49c3e", "#2f9e8f", "#7a4fd1", "#d94b3f", "#2f7fd1", "#e46fa8"];
export const BGS = [["#bfe9e3", "#78afd4"], ["#f3e6bf", "#edca6d"], ["#e4d2f5", "#a759d1"], ["#ffd9cf", "#f08d7a"], ["#d6e8ff", "#6aa0e0"], ["#d9f2d0", "#79c26a"]];
export const DEFAULT_LOOK: HeroLook = { skin: 1, hair: "short", hairColor: 0, outfit: 0, accessory: "star", bg: 0, cape: true };

export function KidAvatar({ look, size = 120, label = "" }: { look: HeroLook; size?: number; label?: string }) {
  const skin = SKINS[look.skin] ?? SKINS[0], hair = HAIRS[look.hairColor] ?? HAIRS[0], out = OUTFITS[look.outfit] ?? OUTFITS[0], [b1, b2] = BGS[look.bg] ?? BGS[0];
  const id = `g${look.bg}${look.outfit}${look.skin}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} className="shrink-0 rounded-full" style={{ boxShadow: "0 0 0 3px #fff, 0 0 0 5px rgb(196 156 62 / .7)" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={b1} /><stop offset="1" stopColor={b2} /></linearGradient><clipPath id={`c${id}`}><circle cx="50" cy="50" r="50" /></clipPath></defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="100" height="100" fill={`url(#${id})`} />
        {look.cape && <path d="M26 66 Q50 58 74 66 L84 100 L16 100 Z" fill="#d94b3f" opacity=".9" />}
        <path d="M24 100 Q26 70 50 68 Q74 70 76 100 Z" fill={out} />
        <rect x="44" y="58" width="12" height="12" rx="4" fill={skin} />
        {look.hair === "bun" && <circle cx="50" cy="16" r="9" fill={hair} />}
        {look.hair === "curly" && <g fill={hair}><circle cx="30" cy="34" r="10" /><circle cx="42" cy="26" r="11" /><circle cx="58" cy="26" r="11" /><circle cx="70" cy="34" r="10" /></g>}
        <ellipse cx="50" cy="42" rx="21" ry="23" fill={skin} />
        {look.hair === "short" && <path d="M29 40 Q30 18 50 18 Q70 18 71 40 Q62 28 50 28 Q38 28 29 40Z" fill={hair} />}
        {look.hair === "spiky" && <path d="M29 40 L30 22 L38 28 L42 14 L50 26 L58 14 L62 28 L70 22 L71 40 Q62 28 50 28 Q38 28 29 40Z" fill={hair} />}
        {look.hair === "bun" && <path d="M29 40 Q30 20 50 20 Q70 20 71 40 Q62 29 50 29 Q38 29 29 40Z" fill={hair} />}
        {look.hair === "curly" && <path d="M30 40 Q36 26 50 28 Q64 26 70 40 Q60 31 50 31 Q40 31 30 40Z" fill={hair} />}
        <circle cx="42" cy="44" r="2.6" fill="#1a1a2e" /><circle cx="58" cy="44" r="2.6" fill="#1a1a2e" />
        <circle cx="41.4" cy="43.3" r=".8" fill="#fff" /><circle cx="57.4" cy="43.3" r=".8" fill="#fff" />
        <path d="M43 52 Q50 59 57 52" stroke="#7a3b2e" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <circle cx="36" cy="51" r="3" fill="#f08d7a" opacity=".35" /><circle cx="64" cy="51" r="3" fill="#f08d7a" opacity=".35" />
        {look.accessory === "glasses" && <g stroke="#1a1a2e" strokeWidth="1.8" fill="rgb(255 255 255 / .25)"><circle cx="42" cy="44" r="6.5" /><circle cx="58" cy="44" r="6.5" /><path d="M48.5 44 H51.5" /></g>}
        {look.accessory === "crown" && <path d="M34 22 L38 10 L44 18 L50 8 L56 18 L62 10 L66 22 Z" fill="#edca6d" stroke="#c49c3e" strokeWidth="1.5" />}
        {look.accessory === "star" && <path d="M50 62 l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z" fill="#edca6d" stroke="#c49c3e" strokeWidth="1" />}
        {look.accessory === "headphones" && <g fill="none" stroke="#1a1a2e" strokeWidth="3"><path d="M28 44 Q28 18 50 18 Q72 18 72 44" /><rect x="24" y="42" width="7" height="12" rx="3" fill="#1a1a2e" /><rect x="69" y="42" width="7" height="12" rx="3" fill="#1a1a2e" /></g>}
      </g>
    </svg>
  );
}
