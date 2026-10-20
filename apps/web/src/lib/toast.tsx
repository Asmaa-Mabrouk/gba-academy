"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Kind = "success" | "error" | "info";
interface Toast { id: number; kind: Kind; text: string }
interface ToastApi { success(t: string): void; error(t: string): void; info(t: string): void }

const Ctx = createContext<ToastApi | null>(null);
let bridge: ToastApi | null = null;
/** For non-hook code (admin helpers). Works after ToastProvider has mounted. */
export const notify: ToastApi = { success: (t) => bridge?.success(t), error: (t) => bridge?.error(t), info: (t) => bridge?.info(t) };
const STYLE: Record<Kind, { bar: string; icon: string; role: "status" | "alert" }> = {
  success: { bar: "border-emerald-500 text-emerald-900", icon: "✓", role: "status" },
  error: { bar: "border-red-500 text-red-900", icon: "!", role: "alert" },
  info: { bar: "border-gold text-navy", icon: "i", role: "status" },
};
const ICON_BG: Record<Kind, string> = { success: "bg-emerald-500", error: "bg-red-500", info: "bg-gold" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const push = useCallback((kind: Kind, text: string) => {
    const id = ++seq.current;
    setItems((l) => [...l.slice(-3), { id, kind, text }]);
    setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4500);
  }, [dismiss]);
  const api = useMemo<ToastApi>(() => ({ success: (t) => push("success", t), error: (t) => push("error", t), info: (t) => push("info", t) }), [push]);
  bridge = api;
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[84px] z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((x) => (
          <div key={x.id} role={STYLE[x.kind].role} className={`toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border-s-4 bg-white p-4 text-sm font-medium shadow-2xl ring-1 ring-navy/10 ${STYLE[x.kind].bar}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${ICON_BG[x.kind]}`} aria-hidden="true">{STYLE[x.kind].icon}</span>
            <span className="flex-1 leading-6">{x.text}</span>
            <button onClick={() => dismiss(x.id)} aria-label="Close" className="-m-1 rounded-full p-1 text-mute hover:bg-navy/5">✕</button>
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
