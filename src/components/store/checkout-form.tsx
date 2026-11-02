"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { placeOrder } from "@/actions/checkout";
import { formatMoney, productImageUrl } from "@/lib/utils";
import { useCart } from "./cart-provider";

interface Props {
  defaults: { name: string; phone: string };
}

export function CheckoutForm({ defaults }: Props) {
  const router = useRouter();
  const { items, subtotal, clear, hydrated } = useCart();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  if (hydrated && items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-muted">Your cart is empty.</p>
        <Link href="/products" className="btn-primary mt-4">Continue shopping</Link>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await placeOrder({
        customerName: fd.get("customerName"),
        phone: fd.get("phone"),
        address: fd.get("address"),
        notes: fd.get("notes") ?? "",
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      clear();
      toast.success("Order placed! Please upload your payment slip.");
      router.push(`/orders/${result.data.orderId}`);
    });
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
      <section className="card space-y-5 p-6">
        <h2 className="text-base font-semibold">Delivery details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="customerName" className="label">Full name</label>
            <input id="customerName" name="customerName" required maxLength={120} autoComplete="name" defaultValue={defaults.name} className="input" aria-invalid={!!err("customerName")} />
            {err("customerName") && <p className="field-error">{err("customerName")}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone</label>
            <input id="phone" name="phone" type="tel" required maxLength={20} autoComplete="tel" defaultValue={defaults.phone} className="input" aria-invalid={!!err("phone")} />
            {err("phone") && <p className="field-error">{err("phone")}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="address" className="label">Delivery address</label>
          <textarea id="address" name="address" required rows={3} maxLength={500} autoComplete="street-address" className="input" placeholder="House / building, street, island / city" aria-invalid={!!err("address")} />
          {err("address") && <p className="field-error">{err("address")}</p>}
        </div>
        <div>
          <label htmlFor="notes" className="label">
            Order notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea id="notes" name="notes" rows={2} maxLength={1000} className="input" placeholder="Anything we should know?" />
        </div>
        <div className="rounded-lg bg-brand-soft p-4 text-sm text-brand">
          <p className="font-medium">Payment by bank transfer</p>
          <p className="mt-1 text-brand/80">
            After placing your order you&apos;ll see our bank details. Transfer the total and upload a photo of the receipt.
          </p>
        </div>
      </section>

      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        <h2 className="text-base font-semibold">Your order</h2>
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto">
          {items.map((i) => {
            const src = productImageUrl(i.image);
            return (
              <li key={i.variantId} className="flex items-center gap-3 text-sm">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-canvas ring-1 ring-line">
                  {src && <Image src={src} alt="" fill sizes="48px" className="object-cover" />}
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink text-[10px] text-white">{i.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.name}</p>
                  {i.variantName !== "Default" && <p className="text-xs text-muted">{i.variantName}</p>}
                </div>
                <p>{formatMoney(i.price * i.quantity)}</p>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex justify-between border-t border-line pt-4 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <button type="submit" disabled={pending || !hydrated} className="btn-brand mt-6 w-full py-3">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
          {pending ? "Placing order…" : "Place order"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">Final prices are confirmed by the store when you place your order.</p>
      </aside>
    </form>
  );
}
