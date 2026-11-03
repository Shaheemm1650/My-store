"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { ProductCardData } from "@/lib/types";
import { useCart } from "./cart-provider";

/** One-click add for single-variant products; links to the product page when options must be chosen. */
export function QuickAdd({ product }: { product: ProductCardData }) {
  const router = useRouter();
  const { add, items } = useCart();
  const soldOut = product.total_stock <= 0;
  const simple = product.variant_count === 1 && !!product.default_variant_id;

  if (soldOut) {
    return (
      <button type="button" disabled className="btn w-full whitespace-nowrap px-2 text-xs sm:px-4 sm:text-sm cursor-not-allowed bg-canvas text-subtle">
        Sold out
      </button>
    );
  }

  if (!simple) {
    return (
      <Link href={`/products/${product.slug}`} className="btn w-full whitespace-nowrap px-2 text-xs sm:px-4 sm:text-sm border border-brand text-brand hover:bg-brand-soft">
        Choose options
      </Link>
    );
  }

  const inCart = items.find((i) => i.variantId === product.default_variant_id)?.quantity ?? 0;
  const maxed = inCart >= product.total_stock;

  return (
    <button
      type="button"
      disabled={maxed}
      onClick={() => {
        add({
          variantId: product.default_variant_id!,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          variantName: product.default_variant_name ?? "Default",
          price: product.min_price ?? 0,
          image: product.image_path,
          stock: product.total_stock,
        });
        toast.success("Added to cart", {
          description: product.name,
          action: { label: "View cart", onClick: () => router.push("/cart") },
        });
      }}
      className="btn w-full whitespace-nowrap px-2 text-xs sm:px-4 sm:text-sm bg-brand text-white hover:bg-brand-dark"
    >
      {inCart > 0 ? <Check className="size-4" aria-hidden /> : <ShoppingCart className="size-4" aria-hidden />}
      {maxed ? "Max in cart" : inCart > 0 ? `In cart (${inCart})` : "Add to cart"}
    </button>
  );
}
