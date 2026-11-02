import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { formatDate, formatMoney, formatOrderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const orders = (data ?? []) as Pick<Order, "id" | "order_number" | "status" | "total" | "created_at">[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">My orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" description="When you place an order it will show up here." action={<Link href="/products" className="btn-primary">Start shopping</Link>} />
      ) : (
        <ul className="card divide-y divide-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-canvas sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Order {formatOrderNumber(o.order_number)}</p>
                  <p className="text-xs text-muted">{formatDate(o.created_at)}</p>
                </div>
                <StatusBadge status={o.status} className="hidden sm:inline-flex" />
                <p className="w-28 text-right text-sm font-semibold">{formatMoney(o.total)}</p>
                <ChevronRight className="size-4 text-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
