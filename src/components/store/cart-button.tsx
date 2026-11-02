"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { count, hydrated } = useCart();
  return (
    <Link href="/cart" className="btn-ghost relative px-2.5" aria-label={`Cart, ${count} items`}>
      <ShoppingBag className="size-5" aria-hidden />
      {hydrated && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-5 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
