"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Kind = "success" | "error" | "warning" | "info";
interface Toast { id: number; kind: Kind; text: string }
interface ToastApi { success(t: string): void; error(t: string): void; warning(t: string): void; info(t: string): void }

const Ctx = createContext<ToastApi | null>(null);
let bridge: ToastApi | null = null;
/** For non-hook code (admin helpers). Works after ToastProvider has mounted. */
export const notify: ToastApi = { success: (t) => bridge?.success(t), error: (t) => bridge?.error(t), warning: (t) => bridge?.warning(t), info: (t) => bridge?.info(t) };
const STYLE: Record<Kind, { box: string; icon: string; iconBg: string; role: "status" | "alert" }> = {
  success: { box: "border-emerald-500 bg-emerald-100/75 text-emerald-950", icon: "✓", iconBg: "bg-emerald-600", role: "status" },
  error: { box: "border-red-500 bg-red-100/75 text-red-950", icon: "✕", iconBg: "bg-red-600", role: "alert" },
  warning: { box: "border-amber-500 bg-amber-100/80 text-amber-950", icon: "!", iconBg: "bg-amber-500", role: "alert" },
  info: { box: "border-gold bg-white/75 text-navy", icon: "i", iconBg: "bg-gold", role: "status" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Kind, text: string) => {
    const id = ++seq.current;
    setItems((l) => [...l.slice(-3), { id, kind, text }]);
    setTimeout(() => dismiss(id), kind === "error" || kind === "warning" ? 7000 : 4500);
  }, [dismiss]);
  const api = useMemo<ToastApi>(() => ({ success: (t) => push("success", t), error: (t) => push("error", t), warning: (t) => push("warning", t), info: (t) => push("info", t) }), [push]);
  bridge = api;
  return (
    <Ctx.Provider value={api}>
      {children}
      {/* Sits at the reading-start side: right in Arabic, left in English, and slides in from that side. */}
      <div className="pointer-events-none fixed start-0 top-[84px] z-[100] flex w-full max-w-md flex-col gap-2 px-4" aria-live="polite">
        {items.map((x) => (
          <div key={x.id} role={STYLE[x.kind].role} className={`toast-slide pointer-events-auto flex items-start gap-3 rounded-2xl border-s-4 p-4 text-sm font-bold shadow-2xl ring-1 ring-black/5 backdrop-blur-md ${STYLE[x.kind].box}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${STYLE[x.kind].iconBg}`} aria-hidden="true">{STYLE[x.kind].icon}</span>
            <span className="flex-1 leading-6">{x.text}</span>
            <button onClick={() => dismiss(x.id)} aria-label="Close" className="-m-1 rounded-full p-1 opacity-60 hover:bg-black/5 hover:opacity-100">✕</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast(): ToastApi {
  const c = useContext(Ctx);
  if (!c) throw new Error("ToastProvider missing");
  return c;
}
