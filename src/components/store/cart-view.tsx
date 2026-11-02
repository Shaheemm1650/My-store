"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ImageOff, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCartSnapshot } from "@/actions/cart";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney, productImageUrl } from "@/lib/utils";
import { useCart, type CartItem } from "./cart-provider";

/** Refreshes cart lines with live price/stock from the server once per visit. */
function useCartSync() {
  const { items, replace, hydrated } = useCart();
  const synced = useRef(false);

  useEffect(() => {
    if (!hydrated || synced.current || items.length === 0) return;
    synced.current = true;
    getCartSnapshot(items.map((i) => i.variantId)).then((snap) => {
      const byId = new Map(snap.map((s) => [s.variantId, s]));
      const changes: string[] = [];
      const next: CartItem[] = [];
      for (const item of items) {
        const live = byId.get(item.variantId);
        if (!live || live.stock <= 0) {
          changes.push(`${item.name} is no longer available`);
          continue;
        }
        const quantity = Math.min(item.quantity, live.stock);
        if (quantity < item.quantity) changes.push(`${item.name}: quantity reduced to ${quantity}`);
        if (live.price !== item.price) changes.push(`${item.name}: price updated`);
        next.push({ ...item, ...live, quantity });
      }
      replace(next);
      if (changes.length) toast.info("Your cart was updated", { description: changes.join(" · ") });
    });
  }, [hydrated, items, replace]);
}

export function CartView() {
  const { items, subtotal, setQuantity, remove, hydrated } = useCart();
  useCartSync();

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-(--radius-card) bg-white ring-1 ring-line" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Looks like you haven't added anything yet."
        action={<Link href="/products" className="btn-primary">Start shopping</Link>}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="card divide-y divide-line">
        {items.map((item) => {
          const src = productImageUrl(item.image);
          return (
            <li key={item.variantId} className="flex gap-4 p-4 sm:p-5">
              <Link href={`/products/${item.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-canvas ring-1 ring-line sm:size-24">
                {src ? (
                  <Image src={src} alt={item.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <ImageOff className="m-auto mt-7 size-6 text-subtle" aria-hidden />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">
                      {item.name}
                    </Link>
                    {item.variantName !== "Default" && <p className="mt-0.5 text-xs text-muted">{item.variantName}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{formatMoney(item.price * item.quantity)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-lg border border-line">
                    <button type="button" className="p-2 disabled:opacity-30" onClick={() => setQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label={`Decrease quantity of ${item.name}`}>
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                    <button type="button" className="p-2 disabled:opacity-30" onClick={() => setQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label={`Increase quantity of ${item.name}`}>
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(item.variantId)} className="btn-ghost px-2 text-xs" aria-label={`Remove ${item.name}`}>
                    <Trash2 className="size-4" aria-hidden /> Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        <h2 className="text-base font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd>Free</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className="btn-brand mt-6 w-full py-3">
          Checkout
        </Link>
        <p className="mt-3 text-center text-xs text-muted">Pay by bank transfer. Upload your slip after ordering.</p>
      </aside>
    </div>
  );
}
