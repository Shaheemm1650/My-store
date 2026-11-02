"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface CartSnapshot {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  price: number;
  stock: number;
  image: string | null;
}

const idsSchema = z.array(z.uuid()).max(50);

/** Returns current price/stock for cart variants so the cart never shows stale data. */
export async function getCartSnapshot(variantIds: string[]): Promise<CartSnapshot[]> {
  const parsed = idsSchema.safeParse(variantIds);
  if (!parsed.success || parsed.data.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("product_variants")
    .select("id, name, price, stock, product:products!inner(id, slug, name, is_active, product_images(storage_path, position))")
    .in("id", parsed.data);

  type Row = {
    id: string;
    name: string;
    price: number;
    stock: number;
    product: { id: string; slug: string; name: string; is_active: boolean; product_images: { storage_path: string; position: number }[] };
  };

  return ((data ?? []) as unknown as Row[])
    .filter((r) => r.product?.is_active)
    .map((r) => ({
      variantId: r.id,
      productId: r.product.id,
      slug: r.product.slug,
      name: r.product.name,
      variantName: r.name,
      price: r.price,
      stock: r.stock,
      image: [...r.product.product_images].sort((a, b) => a.position - b.position)[0]?.storage_path ?? null,
    }));
}
