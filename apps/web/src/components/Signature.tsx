/** Signature slot. Shows the image when provided, otherwise a labelled placeholder scribble. */
export function Signature({ label, image, name = "x", className = "" }: { label: string; image?: string | null; name?: string; className?: string }) {
  if (image) return <img src={image} alt={label} className={`h-14 w-auto ${className}`} />;
  // deterministic pseudo-signature so each person's placeholder looks different
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = (n: number) => ((h >> n) & 15) / 15;
  const d = `M4 ${34 + r(1) * 8} C ${20 + r(2) * 10} ${4 + r(3) * 10}, ${34} ${50 - r(4) * 6}, ${52} ${20 + r(5) * 10} S ${74} ${8 + r(6) * 8}, ${88} ${30 + r(7) * 6} S ${112} ${44 - r(8) * 6}, ${126} ${24 + r(9) * 8} C ${136} ${14}, ${146} ${36}, ${158} ${28 + r(10) * 6}`;
  return (
    <span className={`inline-flex flex-col items-start ${className}`} aria-label={label}>
      <svg width="170" height="56" viewBox="0 0 170 56" fill="none" aria-hidden="true">
        <path d={d} stroke="#0b1327" strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M4 50 H166" stroke="#c49c3e" strokeOpacity=".7" strokeDasharray="3 4" />
      </svg>
      <span className="text-[11px] text-mute">{label}</span>
    </span>
  );
}
