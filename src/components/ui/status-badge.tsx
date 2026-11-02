import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  slip_uploaded: "bg-sky-50 text-sky-800 ring-sky-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  delivered: "bg-zinc-100 text-zinc-800 ring-zinc-300",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
