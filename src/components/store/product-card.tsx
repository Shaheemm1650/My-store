import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { ProductCardData } from "@/lib/types";
import { cn, formatMoney, productImageUrl } from "@/lib/utils";
import { QuickAdd } from "./quick-add";

export function discountPercent(p: Pick<ProductCardData, "min_price" | "compare_at_price">) {
  if (p.compare_at_price == null || p.min_price == null || p.compare_at_price <= p.min_price) return 0;
  return Math.round((1 - p.min_price / p.compare_at_price) * 100);
}

export function ProductCard({ product, priority = false, className }: { product: ProductCardData; priority?: boolean; className?: string }) {
  const src = productImageUrl(product.image_path);
  const soldOut = product.total_stock <= 0;
  const off = discountPercent(product);
  const lowStock = !soldOut && product.total_stock <= 5;
  const href = `/products/${product.slug}`;

  return (
    <article className={cn(className, "group flex flex-col overflow-hidden rounded-(--radius-card) border border-line bg-white transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_12px_32px_-12px_rgb(54_40_160/0.25)]")}>
      <Link href={href} className="relative block aspect-square overflow-hidden bg-canvas" tabIndex={-1} aria-hidden>
        {src ? (
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
            className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.05]", soldOut && "opacity-60 grayscale")}
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center text-subtle">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && !soldOut && <span className="rounded-md bg-danger px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>}
          {product.is_featured && !soldOut && <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-ink">Popular</span>}
          {soldOut && <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-medium text-white">Sold out</span>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        {product.category_name && <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">{product.category_name}</p>}
        <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-medium leading-snug">
          <Link href={href} className="hover:text-brand">{product.name}</Link>
        </h3>
        <div className="mt-auto pt-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn("text-lg font-bold", off > 0 ? "text-danger" : "text-ink")}>{formatMoney(product.min_price)}</span>
            {off > 0 && <span className="text-xs text-subtle line-through">{formatMoney(product.compare_at_price)}</span>}
          </p>
          <p className={cn("text-xs", lowStock ? "font-medium text-warning" : "text-transparent select-none")}>
            {lowStock ? `Only ${product.total_stock} left` : "."}
          </p>
        </div>
        <div className="mt-2">
          <QuickAdd product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, columns = "default" }: { products: ProductCardData[]; columns?: "default" | "wide" }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-5",
        columns === "wide" ? "md:grid-cols-4 xl:grid-cols-5" : "md:grid-cols-3 xl:grid-cols-4",
      )}
    >
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          priority={i < 4}
          // A single row of 5 would leave one card dangling on smaller screens.
          className={columns === "wide" && products.length === 5 && i === 4 ? "max-xl:hidden" : undefined}
        />
      ))}
    </div>
  );
}
