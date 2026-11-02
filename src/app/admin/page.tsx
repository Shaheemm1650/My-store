import Link from "next/link";
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";
import { formatDate, formatMoney, formatOrderNumber } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

interface Stats {
  revenue: number;
  revenue_30d: number;
  orders_total: number;
  orders_by_status: Partial<Record<OrderStatus, number>>;
  products_total: number;
  products_active: number;
  customers_total: number;
  low_stock: number;
  daily: { day: string; orders: number; revenue: number }[];
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ data: statsData }, { data: recent }, { data: lowStock }] = await Promise.all([
    supabase.rpc("admin_stats"),
    supabase.from("orders").select("id, order_number, customer_name, status, total, created_at").order("created_at", { ascending: false }).limit(8),
    supabase
      .from("product_variants")
      .select("id, name, stock, product:products(id, name)")
      .lte("stock", 5)
      .order("stock")
      .limit(8),
  ]);

  const stats = statsData as Stats | null;
  if (!stats) return <p className="text-sm text-danger">Could not load statistics.</p>;

  const maxRevenue = Math.max(1, ...stats.daily.map((d) => d.revenue));
  const cards = [
    { label: "Revenue (approved)", value: formatMoney(stats.revenue), sub: `${formatMoney(stats.revenue_30d)} last 30 days`, icon: DollarSign },
    { label: "Orders", value: stats.orders_total.toLocaleString(), sub: `${stats.orders_by_status.slip_uploaded ?? 0} awaiting review`, icon: ShoppingCart },
    { label: "Products", value: stats.products_total.toLocaleString(), sub: `${stats.products_active} active`, icon: Package },
    { label: "Customers", value: stats.customers_total.toLocaleString(), sub: `${stats.low_stock} low-stock variants`, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between text-sm text-muted">
              {label}
              <Icon className="size-4" aria-hidden />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <h2 className="font-semibold">Revenue · last 14 days</h2>
          <p className="text-xs text-muted">Approved and delivered orders, by order date</p>
          <div className="mt-6 flex h-48 items-end gap-1.5" role="img" aria-label="Daily revenue bar chart">
            {stats.daily.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="rounded-t bg-brand/80 transition-colors group-hover:bg-brand"
                  style={{ height: `${Math.max(d.revenue ? 4 : 1, (d.revenue / maxRevenue) * 100)}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block">
                  {formatDate(d.day, false)}: {formatMoney(d.revenue)} · {d.orders} orders
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-subtle">
            <span>{stats.daily[0] && formatDate(stats.daily[0].day, false)}</span>
            <span>Today</span>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Orders by status</h2>
          <ul className="space-y-3">
            {ORDER_STATUSES.map((s) => {
              const n = stats.orders_by_status[s] ?? 0;
              return (
                <li key={s}>
                  <Link href={`/admin/orders?status=${s}`} className="flex items-center justify-between text-sm hover:underline">
                    <span>{ORDER_STATUS_LABEL[s]}</span>
                    <span className="font-medium tabular-nums">{n}</span>
                  </Link>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${stats.orders_total ? (n / stats.orders_total) * 100 : 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {((recent ?? []) as Order[]).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-canvas">
                  <span className="w-16 font-medium">{formatOrderNumber(o.order_number)}</span>
                  <span className="min-w-0 flex-1 truncate text-muted">{o.customer_name}</span>
                  <StatusBadge status={o.status} className="hidden sm:inline-flex" />
                  <span className="w-28 text-right font-medium">{formatMoney(o.total)}</span>
                </Link>
              </li>
            ))}
            {!recent?.length && <li className="px-5 py-8 text-center text-sm text-muted">No orders yet.</li>}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <h2 className="flex items-center gap-2 p-5 font-semibold">
            <AlertTriangle className="size-4 text-warning" aria-hidden /> Low stock
          </h2>
          <ul className="divide-y divide-line border-t border-line">
            {((lowStock ?? []) as unknown as { id: string; name: string; stock: number; product: { id: string; name: string } | null }[]).map((v) => (
              <li key={v.id}>
                <Link href={`/admin/products/${v.product?.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-canvas">
                  <span className="min-w-0 truncate">
                    {v.product?.name}
                    {v.name !== "Default" && <span className="text-muted"> · {v.name}</span>}
                  </span>
                  <span className={v.stock === 0 ? "font-medium text-danger" : "font-medium text-warning"}>{v.stock}</span>
                </Link>
              </li>
            ))}
            {!lowStock?.length && <li className="px-5 py-8 text-center text-sm text-muted">All stocked up.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
