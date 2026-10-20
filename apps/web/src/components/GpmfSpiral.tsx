// The GPMF flower mark, animated. Layers rotate in opposite directions with a gold glow.
// Pure CSS animation (see globals.css); respects prefers-reduced-motion.
import type { CSSProperties } from "react";

export function GpmfSpiral({ size = 420, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      <div className="absolute inset-[-12%] rounded-full" style={{ background: "radial-gradient(closest-side, rgb(237 202 109 / .28), transparent 70%)", animation: "breathe 6s ease-in-out infinite" }} />
      {[0, 1, 2].map((i) => (
        <span key={i} className="absolute inset-0 rounded-full border border-gold/40" style={{ animation: `pulse-ring 5s ${i * 1.6}s ease-out infinite` }} />
      ))}
      {/* slow counter-rotating halo */}
      <img src="/brand/gpmf-flower.png" alt="" className="absolute inset-[6%] h-[88%] w-[88%] object-contain opacity-35 blur-[1px]" style={{ animation: "spin-rev 38s linear infinite" }} />
      {/* main mark */}
      <img src="/brand/gpmf-flower.png" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: "spin-fwd 60s linear infinite", filter: "drop-shadow(0 0 24px rgb(237 202 109 / .45))" }} />
    </div>
  );
}
