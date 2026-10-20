"use client";
import { adminApi } from "@/lib/admin-api";
import { dateTime, moneyPlain as money, tr } from "@/lib/i18n";
import { useAdmin } from "./AdminShell";
import { useLoad } from "./hooks";
import { Badge, PageTitle, Table } from "./ui";

export function AdminOrders() {
  const { locale, a, token } = useAdmin();
  const t = a.orders;
  const { data } = useLoad(() => adminApi.orders(token), [token]);
  return (
    <>
      <PageTitle>{t.title}</PageTitle>
      {!data ? <p className="text-mute">{a.common.loading}</p> : data.length === 0 ? <p className="card p-10 text-center text-mute">{a.common.empty}</p> : (
        <Table head={[t.number, t.customer, t.items, t.method, t.vat, a.common.total, a.common.status, a.common.date]}>
          {data.map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-3 font-bold text-navy" dir="ltr">{o.number}<div className="text-xs font-normal text-mute">{o.invoiceNumber}</div></td>
              <td className="px-4 py-3">{o.userName}<div className="text-xs text-mute" dir="ltr">{o.userEmail}</div></td>
              <td className="px-4 py-3">{o.lines.map((l, i) => <div key={i}>{tr(l.courseTitle, locale)} <span className="text-xs text-mute">({a.courses.modes[l.mode]})</span></div>)}</td>
              <td className="px-4 py-3">{o.paymentMethod}</td>
              <td className="px-4 py-3">{money(o.vatHalalas, locale)}</td>
              <td className="px-4 py-3 font-bold">{money(o.totalHalalas, locale)}{o.promoCode && <div className="text-xs font-normal text-gold-deep"><span dir="ltr">{o.promoCode}</span> · −{money(o.discountHalalas ?? 0, locale)}</div>}</td>
              <td className="px-4 py-3"><Badge tone={o.status === "paid" ? "green" : o.status === "failed" ? "red" : "sand"}>{t.statuses[o.status]}</Badge></td>
              <td className="px-4 py-3 text-mute">{dateTime(o.createdAt, locale)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
