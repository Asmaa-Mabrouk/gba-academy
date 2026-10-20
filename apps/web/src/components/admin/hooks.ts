"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { AdminDict } from "@/lib/dict/admin";

/** Load data once and expose reload. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => { fn().then((d) => { setData(d); setErr(""); }).catch((e) => setErr(e instanceof ApiError ? e.code : "error")); }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, err, reload, setData };
}

export function errorText(a: AdminDict, e: unknown): string {
  const code = e instanceof ApiError ? e.code : "default";
  return (a.common.errors as Record<string, string>)[code] ?? a.common.errors.default;
}
