import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Landmark } from "lucide-react";
import { OrderHistory, OrderItems, OrderProgress } from "@/components/store/order-parts";
import { SlipUpload } from "@/components/store/slip-upload";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { getSlipUrl } from "@/lib/slips.server";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderStatusHistory } from "@/lib/types";
import { formatDate, formatMoney, formatOrderNumber } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const user = await requireUser(`/orders/${id}`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_status_history(id, order_id, status, note, created_at)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) notFound();

  const order = data as Order & { order_items: OrderItem[]; order_status_history: OrderStatusHistory[] };
  const history = [...order.order_status_history].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const slipUrl = await getSlipUrl(order.payment_slip_path);
  const canUpload = order.status === "pending" || order.status === "slip_uploaded";

  const bank = {
    name: process.env.BANK_NAME,
    accountName: process.env.BANK_ACCOUNT_NAME,
    accountNumber: process.env.BANK_ACCOUNT_NUMBER,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/orders" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All orders
      </Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Order {formatOrderNumber(order.order_number)}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="card mb-8 p-5">
        <OrderProgress status={order.status} />
        {order.status === "rejected" && order.admin_note && (
          <p className="mt-3 text-sm text-muted">
            <span className="font-medium text-ink">Reason:</span> {order.admin_note}
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {canUpload && (
            <section className="card p-6">
              <div className="mb-5 flex items-start gap-3">
                <span className="rounded-lg bg-brand-soft p-2 text-brand">
                  <Landmark className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-semibold">{order.status === "pending" ? "Complete your payment" : "Payment slip received"}</h2>
                  <p className="text-sm text-muted">
                    {order.status === "pending"
                      ? `Transfer ${formatMoney(order.total)} to the account below, then upload your receipt.`
                      : "We're reviewing your slip. You can replace it if you uploaded the wrong image."}
                  </p>
                </div>
              </div>
              {order.status === "pending" && (
                <dl className="mb-6 grid gap-3 rounded-lg bg-canvas p-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted">Bank</dt><dd className="font-medium">{bank.name ?? "—"}</dd></div>
                  <div><dt className="text-muted">Account name</dt><dd className="font-medium">{bank.accountName ?? "—"}</dd></div>
                  <div><dt className="text-muted">Account number</dt><dd className="font-mono font-medium">{bank.accountNumber ?? "—"}</dd></div>
                  <div><dt className="text-muted">Amount · Reference</dt><dd className="font-medium">{formatMoney(order.total)} · {formatOrderNumber(order.order_number)}</dd></div>
                </dl>
              )}
              <SlipUpload orderId={order.id} replacing={order.status === "slip_uploaded"} />
            </section>
          )}

          <section className="card p-6">
            <h2 className="mb-2 font-semibold">Items</h2>
            <OrderItems order={order} items={order.order_items} />
          </section>
        </div>

        <aside className="space-y-8">
          <section className="card p-6 text-sm">
            <h2 className="mb-3 font-semibold">Delivery</h2>
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-muted">{order.phone}</p>
            <p className="mt-2 whitespace-pre-line text-muted">{order.address}</p>
            {order.notes && <p className="mt-3 border-t border-line pt-3 text-muted">{order.notes}</p>}
          </section>

          {slipUrl && (
            <section className="card p-6">
              <h2 className="mb-3 font-semibold">Your payment slip</h2>
              <a href={slipUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg ring-1 ring-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                <img src={slipUrl} alt="Uploaded payment slip" className="max-h-80 w-full object-contain" />
              </a>
            </section>
          )}

          <section className="card p-6">
            <h2 className="mb-4 font-semibold">History</h2>
            <OrderHistory history={history} />
          </section>
        </aside>
      </div>
    </div>
  );
}
