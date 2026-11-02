import Link from "next/link";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";
import { cn, formatDate, formatMoney, formatOrderNumber } from "@/lib/utils";

export const metadata = { title: "Orders" };
const PAGE_SIZE = 25;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = sp.q?.trim().slice(0, 60) ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, phone, status, total, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (q) {
    const num = Number(q.replace(/^#/, ""));
    if (Number.isInteger(num) && num > 0) query = query.eq("order_number", num);
    else {
      // Escape LIKE wildcards; strip PostgREST filter syntax characters.
      const safe = q.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/[,()"]/g, " ");
      query = query.or(`customer_name.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
  }
  const { data, count } = await query;
  const orders = (data ?? []) as Order[];

  const href = (params: Record<string, string | undefined>) => {
    const s = new URLSearchParams();
    for (const [k, v] of Object.entries({ status, q: q || undefined, ...params })) if (v) s.set(k, v);
    return `/admin/orders${s.size ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Filter by status">
          {[undefined, ...ORDER_STATUSES].map((s) => (
            <Link
              key={s ?? "all"}
              href={href({ status: s, page: undefined })}
              className={cn("shrink-0 rounded-full px-3 py-1.5 text-sm", status === s ? "bg-ink text-white" : "text-muted hover:bg-canvas")}
            >
              {s ? ORDER_STATUS_LABEL[s] : "All"}
            </Link>
          ))}
        </nav>
        <form className="relative w-full lg:max-w-xs" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Order #, name or phone" className="input pl-9" aria-label="Search orders" />
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-canvas">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{formatOrderNumber(o.order_number)}</Link>
                </td>
                <td className="px-4 py-3">
                  <p>{o.customer_name}</p>
                  <p className="text-xs text-muted">{o.phone}</p>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-right font-medium">{formatMoney(o.total)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)} makeHref={(n) => href({ page: String(n) })} />
    </div>
  );
}
