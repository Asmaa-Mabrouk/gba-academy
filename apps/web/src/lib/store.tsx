"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { userApi } from "./api";
import type { Locale, OrderLine, RegisterInput, User } from "./types";

interface AuthCtx {
  user: User | null;
  token: string | null;
  ready: boolean;
  login(email: string, password: string): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): void;
}
interface CartCtx {
  lines: OrderLine[];
  add(line: OrderLine): void;
  remove(offeringId: string): void;
  clear(): void;
  has(offeringId: string): boolean;
}

const Auth = createContext<AuthCtx | null>(null);
const Cart = createContext<CartCtx | null>(null);
const TOKEN_KEY = "gba.token";
const CART_KEY = "gba.cart";

export function Providers({ children }: { locale: Locale; children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<OrderLine[]>([]);

  useEffect(() => {
    let t: string | null = null;
    try {
      t = localStorage.getItem(TOKEN_KEY);
      setLines(JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"));
    } catch { /* storage unavailable */ }
    if (!t) { setReady(true); return; }
    userApi.me(t).then((u) => { if (u) { setUser(u); setToken(t); } setReady(true); }).catch(() => setReady(true));
  }, []);

  const persistCart = (l: OrderLine[]) => { setLines(l); try { localStorage.setItem(CART_KEY, JSON.stringify(l)); } catch { /* ignore */ } };

  const setSession = useCallback((r: { token: string; user: User }) => {
    setUser(r.user); setToken(r.token);
    try { localStorage.setItem(TOKEN_KEY, r.token); } catch { /* ignore */ }
  }, []);

  const auth = useMemo<AuthCtx>(() => ({
    user, token, ready,
    login: async (e, p) => { const r = await userApi.login(e, p); setSession(r); return r.user; },
    register: async (i) => { const r = await userApi.register(i); setSession(r); return r.user; },
    logout: () => { setUser(null); setToken(null); try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
  }), [user, token, ready, setSession]);

  const cart = useMemo<CartCtx>(() => ({
    lines,
    add: (l) => persistCart([...lines.filter((x) => x.courseSlug !== l.courseSlug), l]),
    remove: (id) => persistCart(lines.filter((x) => x.offeringId !== id)),
    clear: () => persistCart([]),
    has: (id) => lines.some((x) => x.offeringId === id),
  }), [lines]);

  return <Auth.Provider value={auth}><Cart.Provider value={cart}>{children}</Cart.Provider></Auth.Provider>;
}

export function useAuth() { const c = useContext(Auth); if (!c) throw new Error("Providers missing"); return c; }
export function useCart() { const c = useContext(Cart); if (!c) throw new Error("Providers missing"); return c; }
