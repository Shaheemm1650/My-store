import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, ProductCardData, ProductWithRelations } from "@/lib/types";

export const PAGE_SIZE = 24;
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
  { value: "relevance", label: "Relevance" },
] as const;

export interface SearchParams {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  featured?: boolean;
  onSale?: boolean;
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, sort_order")
    .order("sort_order")
    .order("name");
  return (data ?? []) as Category[];
});

export async function searchProducts(params: SearchParams, pageSize = PAGE_SIZE) {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const args: Record<string, unknown> = {
    p_query: params.q ?? null,
    p_category: params.category ?? null,
    p_min_price: params.min ?? null,
    p_max_price: params.max ?? null,
    p_in_stock: params.inStock ?? false,
    p_sort: params.sort ?? (params.q ? "relevance" : "newest"),
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
    p_featured: params.featured ?? false,
  };
  if (params.onSale) args.p_on_sale = true;

  let { data, error } = await supabase.rpc("search_products", args);

  // PGRST202 = function signature not found. Happens if the storefront_v2 migration
  // hasn't been applied yet: retry without the newer argument so the shop keeps working.
  if (error?.code === "PGRST202" && "p_on_sale" in args) {
    delete args.p_on_sale;
    ({ data, error } = await supabase.rpc("search_products", args));
  }

  if (error) {
    console.error("search_products failed", error);
    return { items: [] as ProductCardData[], total: 0, page, totalPages: 0 };
  }

  const result = data as { total: number; items: ProductCardData[] };
  return { items: result.items, total: result.total, page, totalPages: Math.ceil(result.total / pageSize) };
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductWithRelations | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id, name, slug), product_variants(*), product_images(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return null;

  const product = data as ProductWithRelations;
  product.product_variants.sort((a, b) => a.position - b.position);
  product.product_images.sort((a, b) => a.position - b.position);
  return product;
});

/** Parses untrusted URL search params into a safe, typed object. */
export function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchParams {
  const str = (k: string) => {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s?.trim() ? s.trim().slice(0, 100) : undefined;
  };
  const money = (k: string) => {
    const n = Number(str(k));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined;
  };
  const page = Number(str("page"));
  const sort = str("sort");
  return {
    q: str("q"),
    category: str("category"),
    min: money("min"),
    max: money("max"),
    inStock: str("stock") === "1",
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : undefined,
    page: Number.isInteger(page) && page > 0 && page < 10_000 ? page : 1,
    onSale: str("sale") === "1",
  };
}
