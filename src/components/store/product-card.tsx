import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { ProductCardData } from "@/lib/types";
import { formatMoney, productImageUrl } from "@/lib/utils";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const src = productImageUrl(product.image_path);
  const soldOut = product.total_stock <= 0;
  const onSale = product.compare_at_price != null && product.min_price != null && product.compare_at_price > product.min_price;

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-(--radius-card) bg-white ring-1 ring-line">
        {src ? (
          <Image
            src={src}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center text-subtle">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {soldOut && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">Sold out</span>}
          {!soldOut && onSale && <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-medium text-white">Sale</span>}
        </div>
      </div>
      <div className="mt-3 space-y-0.5 px-0.5">
        {product.category_name && <p className="text-xs text-muted">{product.category_name}</p>}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">{product.name}</h3>
        <p className="text-sm">
          <span className="font-semibold">{formatMoney(product.min_price)}</span>
          {onSale && <span className="ml-2 text-xs text-subtle line-through">{formatMoney(product.compare_at_price)}</span>}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
