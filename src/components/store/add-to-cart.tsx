"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { ProductVariant } from "@/lib/types";
import { cn, formatMoney } from "@/lib/utils";
import { useCart } from "./cart-provider";

interface Props {
  product: { id: string; slug: string; name: string; image: string | null };
  variants: ProductVariant[];
}

export function AddToCart({ product, variants }: Props) {
  const router = useRouter();
  const { add, items } = useCart();
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);

  const variant = variants.find((v) => v.id === variantId);
  if (!variant) return null;

  const inCart = items.find((i) => i.variantId === variant.id)?.quantity ?? 0;
  const available = Math.max(0, variant.stock - inCart);
  const soldOut = variant.stock <= 0;
  const onSale = variant.compare_at_price != null && variant.compare_at_price > variant.price;
  const showPicker = variants.length > 1 || variants[0]?.name !== "Default";

  function handleAdd() {
    if (!variant || available <= 0) return;
    const quantity = Math.min(qty, available);
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantName: variant.name,
        price: variant.price,
        image: product.image,
        stock: variant.stock,
      },
      quantity,
    );
    setQty(1);
    toast.success("Added to cart", {
      description: `${product.name}${showPicker ? ` · ${variant.name}` : ""} × ${quantity}`,
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatMoney(variant.price)}</span>
        {onSale && <span className="text-base text-subtle line-through">{formatMoney(variant.compare_at_price)}</span>}
        {onSale && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-danger">
            Save {Math.round((1 - variant.price / variant.compare_at_price!) * 100)}%
          </span>
        )}
      </div>

      {showPicker && (
        <fieldset>
          <legend className="label">
            Option: <span className="font-normal text-muted">{variant.name}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                aria-pressed={v.id === variant.id}
                className={cn(
                  "relative min-w-14 rounded-lg border px-4 py-2 text-sm transition",
                  v.id === variant.id ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink",
                  v.stock <= 0 && "text-subtle line-through",
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p className={cn("flex items-center gap-1.5 text-sm", soldOut ? "text-danger" : variant.stock <= 5 ? "text-warning" : "text-brand")}>
        {soldOut ? "Out of stock" : variant.stock <= 5 ? `Only ${variant.stock} left` : (<><Check className="size-4" aria-hidden /> In stock</>)}
      </p>

      <div className="flex gap-3">
        <div className="flex items-center rounded-lg border border-line bg-white">
          <button type="button" className="p-3 disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button type="button" className="p-3 disabled:opacity-30" onClick={() => setQty((q) => Math.min(available, q + 1))} disabled={qty >= available} aria-label="Increase quantity">
            <Plus className="size-4" />
          </button>
        </div>
        <button type="button" onClick={handleAdd} disabled={available <= 0} className="btn-brand flex-1 py-3">
          <ShoppingBag className="size-4" aria-hidden />
          {soldOut ? "Sold out" : available <= 0 ? "Max in cart" : "Add to cart"}
        </button>
      </div>
      {inCart > 0 && (
        <p className="text-sm text-muted">
          {inCart} in your cart ·{" "}
          <Link href="/cart" className="font-medium text-ink underline">
            Go to cart
          </Link>
        </p>
      )}
    </div>
  );
}
