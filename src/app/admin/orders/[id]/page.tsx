import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileX } from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderHistory, OrderItems, OrderProgress } from "@/components/store/order-parts";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSlipUrl } from "@/lib/slips.server";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderStatusHistory } from "@/lib/types";
import { formatDate, formatMoney, formatOrderNumber } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(id, order_id, status, note, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const order = data as Order & { order_items: OrderItem[]; order_status_history: OrderStatusHistory[] };
  const history = [...order.order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const [slipUrl, { data: profile }] = await Promise.all([
    getSlipUrl(order.payment_slip_path),
    supabase.from("profiles").select("full_name, phone").eq("id", order.user_id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order {formatOrderNumber(order.order_number)}</h1>
          <p className="text-sm text-muted">Placed {formatDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="card p-5">
        <OrderProgress status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Payment slip</h2>
              {slipUrl && (
                <a href={slipUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost px-2 text-xs">
                  Open full size <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
            {slipUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                <img src={slipUrl} alt={`Payment slip for order ${order.order_number}`} className="max-h-[560px] w-full rounded-lg bg-canvas object-contain ring-1 ring-line" />
                {order.slip_uploaded_at && <p className="mt-2 text-xs text-muted">Uploaded {formatDate(order.slip_uploaded_at)}</p>}
                <p className="mt-3 rounded-lg bg-canvas p-3 text-sm">
                  Expected amount: <span className="font-semibold">{formatMoney(order.total)}</span> · Reference{" "}
                  <span className="font-semibold">{formatOrderNumber(order.order_number)}</span>
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg bg-canvas py-10 text-sm text-muted">
                <FileX className="size-6" aria-hidden /> No slip uploaded yet
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-2 font-semibold">Items</h2>
            <OrderItems order={order} items={order.order_items} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">Actions</h2>
            <OrderActions orderId={order.id} status={order.status} />
            {order.admin_note && (
              <p className="mt-4 border-t border-line pt-4 text-sm">
                <span className="font-medium">Note:</span> <span className="text-muted">{order.admin_note}</span>
              </p>
            )}
          </section>

          <section className="card p-5 text-sm sm:p-6">
            <h2 className="mb-3 font-semibold">Customer</h2>
            <p className="font-medium">{order.customer_name}</p>
            <a href={`tel:${order.phone}`} className="text-brand hover:underline">{order.phone}</a>
            <p className="mt-2 whitespace-pre-line text-muted">{order.address}</p>
            {order.notes && <p className="mt-3 border-t border-line pt-3"><span className="font-medium">Customer note:</span> <span className="text-muted">{order.notes}</span></p>}
            {profile && profile.full_name !== order.customer_name && (
              <p className="mt-3 border-t border-line pt-3 text-xs text-muted">Account: {profile.full_name ?? "—"} · {profile.phone ?? "—"}</p>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">History</h2>
            <OrderHistory history={history} />
          </section>
        </aside>
      </div>
    </div>
  );
}
