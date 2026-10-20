export function Avatar({ name, hue, size = 56 }: { name: string; hue: number; size?: number }) {
  const initials = name.replace(/^د\.\s*|^Dr\.\s*/, "").split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-inner"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 30%))`, boxShadow: "0 0 0 3px #fff, 0 0 0 5px rgb(196 156 62 / .6)" }}
      aria-hidden="true"
    >{initials}</span>
  );
}
