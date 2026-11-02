import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ImageManager } from "@/components/admin/image-manager";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithRelations } from "@/lib/types";
import { uuidSchema } from "@/lib/validation";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data }, categories] = await Promise.all([
    supabase.from("products").select("*, category:categories(id, name, slug), product_variants(*), product_images(*)").eq("id", id).maybeSingle(),
    getCategories(),
  ]);
  if (!data) notFound();

  const product = data as ProductWithRelations;
  product.product_variants.sort((a, b) => a.position - b.position);
  product.product_images.sort((a, b) => a.position - b.position);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Products
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        {product.is_active && (
          <Link href={`/products/${product.slug}`} target="_blank" className="btn-secondary">
            View in store <ExternalLink className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      <ImageManager productId={product.id} images={product.product_images} />
      <ProductForm key={product.updated_at} product={product} categories={categories} />
    </div>
  );
}
