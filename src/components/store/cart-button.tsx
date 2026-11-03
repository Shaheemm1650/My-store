"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { count, subtotal, hydrated } = useCart();
  return (
    <Link
      href="/cart"
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition hover:bg-canvas"
      aria-label={`Cart, ${hydrated ? count : 0} items`}
    >
      <span className="relative">
        <ShoppingCart className="size-6 text-ink" aria-hidden />
        {hydrated && count > 0 && (
          <span className="absolute -right-2 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-5 text-ink ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="hidden flex-col leading-tight lg:flex">
        <span className="text-[11px] text-muted">Cart</span>
        <span className="text-sm font-semibold">{hydrated ? formatMoney(subtotal) : "—"}</span>
      </span>
    </Link>
  );
}
