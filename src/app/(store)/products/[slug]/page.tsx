import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AddToCart } from "@/components/store/add-to-cart";
import { ProductGallery } from "@/components/store/product-gallery";
import { getProductBySlug } from "@/lib/catalog";
import { env } from "@/lib/env";
import { productImageUrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  const image = productImageUrl(product.product_images[0]?.storage_path);
  return {
    title: product.name,
    description: product.description.slice(0, 160) || undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const cover = product.product_images[0]?.storage_path ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.product_images.map((i) => productImageUrl(i.storage_path)),
    offers: product.product_variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku ?? undefined,
      price: (v.price / 100).toFixed(2),
      priceCurrency: env.NEXT_PUBLIC_CURRENCY,
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted">
        <Link href="/products" className="hover:text-ink">Shop</Link>
        {product.category && (
          <>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate text-ink" aria-current="page">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.product_images} name={product.name} />

        <div className="lg:py-4">
          {product.category && <p className="text-sm font-medium text-brand">{product.category.name}</p>}
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">{product.name}</h1>
          <div className="mt-6">
            <AddToCart
              product={{ id: product.id, slug: product.slug, name: product.name, image: cover }}
              variants={product.product_variants}
            />
          </div>
          {product.description && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="mb-3 text-sm font-semibold">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <script
        type="application/ld+json"
        nonce={nonce}
        // JSON.stringify output is escaped for "<" to prevent breaking out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
