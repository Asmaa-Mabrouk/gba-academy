"use client";
import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { dateOnly, num } from "@/lib/i18n";
import type { Role } from "@/lib/types";
import { useAdmin } from "./AdminShell";
import { errorText, useLoad } from "./hooks";
import { Badge, PageTitle, Table } from "./ui";

export function AdminUsers() {
  const { locale, a, token } = useAdmin();
  const t = a.users;
  const { data, reload } = useLoad(() => adminApi.users(token), [token]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const toggle = async (id: string, roles: Role[], r: Role) => {
    const next = roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r];
    try { await adminApi.setRoles(token, id, next); setErr(""); reload(); } catch (e) { setErr(errorText(a, e)); }
  };
  const list = (data ?? []).filter((u) => !q || `${u.fullName} ${u.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageTitle>{t.title}</PageTitle>
      <input className="input mb-4 max-w-sm" placeholder={a.common.search} value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {!data ? <p className="text-mute">{a.common.loading}</p> : (
        <Table head={[t.name, t.email, t.roles, t.enrollments, t.registeredFor, a.common.date]}>
          {list.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-bold text-navy">{u.fullName}</td>
              <td className="px-4 py-3" dir="ltr">{u.email}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {(["learner", "mentor", "admin"] as Role[]).map((r) => (
                    <label key={r} className={`chip cursor-pointer ${u.roles.includes(r) ? "bg-navy text-gold-light" : "bg-sand text-navy/60"} ${r === "learner" ? "pointer-events-none" : ""}`}>
                      <input type="checkbox" className="sr-only" checked={u.roles.includes(r)} onChange={() => toggle(u.id, u.roles, r)} />{t.roleNames[r]}
                    </label>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">{num(u.enrollments, locale)}</td>
              <td className="px-4 py-3">{u.registeringFor === "child" ? <Badge tone="gold">{t.forChild}</Badge> : t.self}</td>
              <td className="px-4 py-3 text-mute">{dateOnly(u.createdAt, locale)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
