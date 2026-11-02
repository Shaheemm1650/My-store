"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/actions/admin-orders";
import type { OrderStatus } from "@/lib/types";

export function OrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  function submit(next: "approved" | "rejected" | "delivered", msg: string) {
    startTransition(async () => {
      const r = await updateOrderStatus({ orderId, status: next, note: note.trim() || undefined });
      if (!r.ok) return void toast.error(r.error);
      toast.success(msg);
      setRejecting(false);
      setNote("");
      router.refresh();
    });
  }

  if (status === "delivered" || status === "rejected") {
    return <p className="text-sm text-muted">No further actions — this order is {status}.</p>;
  }

  if (rejecting) {
    return (
      <div className="space-y-3">
        <label htmlFor="reject-note" className="label">Reason for rejection (shown to customer)</label>
        <textarea id="reject-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} className="input" placeholder="e.g. Transfer amount does not match the order total." autoFocus />
        <p className="text-xs text-muted">Rejecting returns the reserved items to stock.</p>
        <div className="flex gap-2">
          <button type="button" disabled={pending || !note.trim()} onClick={() => submit("rejected", "Order rejected")} className="btn-danger flex-1">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Confirm rejection
          </button>
          <button type="button" onClick={() => setRejecting(false)} className="btn-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {status === "slip_uploaded" && (
        <button type="button" disabled={pending} onClick={() => submit("approved", "Payment approved")} className="btn-brand py-3">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />} Approve payment
        </button>
      )}
      {status === "approved" && (
        <button type="button" disabled={pending} onClick={() => submit("delivered", "Marked as delivered")} className="btn-primary py-3">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Truck className="size-4" aria-hidden />} Mark as delivered
        </button>
      )}
      {(status === "slip_uploaded" || status === "pending") && (
        <button type="button" disabled={pending} onClick={() => setRejecting(true)} className="btn-secondary text-danger">
          <X className="size-4" aria-hidden /> {status === "pending" ? "Cancel / reject order" : "Reject"}
        </button>
      )}
      {status === "pending" && <p className="text-xs text-muted">Waiting for the customer to upload a payment slip.</p>}
    </div>
  );
}
