import Image from "next/image";
import { Check, X } from "lucide-react";
import { ORDER_STATUS_LABEL, type Order, type OrderItem, type OrderStatus, type OrderStatusHistory } from "@/lib/types";
import { cn, formatDate, formatMoney, productImageUrl } from "@/lib/utils";

const FLOW: OrderStatus[] = ["pending", "slip_uploaded", "approved", "delivered"];

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-danger">
        <X className="size-5 shrink-0" aria-hidden /> This order was rejected.
      </div>
    );
  }
  const current = FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex flex-col gap-2" aria-current={i === current ? "step" : undefined}>
            <span className={cn("h-1.5 rounded-full", done ? "bg-brand" : "bg-line")} />
            <span className={cn("flex items-center gap-1 text-xs", done ? "font-medium text-ink" : "text-subtle")}>
              {i < current && <Check className="size-3 text-brand" aria-hidden />}
              {ORDER_STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItems({ order, items }: { order: Pick<Order, "subtotal" | "shipping_fee" | "total">; items: OrderItem[] }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {items.map((item) => {
          const src = productImageUrl(item.image_path);
          return (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-canvas ring-1 ring-line">
                {src && <Image src={src} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{item.product_name}</p>
                <p className="text-xs text-muted">
                  {item.variant_name !== "Default" && `${item.variant_name} · `}
                  {item.quantity} × {formatMoney(item.unit_price)}
                </p>
              </div>
              <p className="text-sm font-medium">{formatMoney(item.line_total)}</p>
            </li>
          );
        })}
      </ul>
      <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatMoney(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd>{order.shipping_fee ? formatMoney(order.shipping_fee) : "Free"}</dd>
        </div>
        <div className="flex justify-between pt-1 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatMoney(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function OrderHistory({ history }: { history: OrderStatusHistory[] }) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {history.map((h) => (
        <li key={h.id} className="relative text-sm">
          <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-brand ring-4 ring-white" aria-hidden />
          <p className="font-medium">{ORDER_STATUS_LABEL[h.status]}</p>
          <p className="text-xs text-muted">{formatDate(h.created_at)}</p>
          {h.note && <p className="mt-1 text-muted">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}
