import Image from "next/image";
import Link from "next/link";
import { ImageOff, Plus, Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, productImageUrl } from "@/lib/utils";

export const metadata = { title: "Products" };
const PAGE_SIZE = 25;

type Row = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_featured: boolean;
  min_price: number | null;
  total_stock: number;
  category: { name: string } | null;
  product_images: { storage_path: string; position: number }[];
  product_variants: { id: string }[];
};

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100) ?? "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id, name, slug, is_active, is_featured, min_price, total_stock, category:categories(name), product_images(storage_path, position), product_variants(id)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  const { data, count } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="size-4" aria-hidden /> Add product
        </Link>
      </div>

      <form className="relative max-w-sm" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
        <input name="q" defaultValue={q} placeholder="Search by name…" className="input pl-9" aria-label="Search products" />
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price from</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => {
              const cover = [...p.product_images].sort((a, b) => a.position - b.position)[0];
              const src = productImageUrl(cover?.storage_path);
              return (
                <tr key={p.id} className="hover:bg-canvas">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-md bg-canvas ring-1 ring-line">
                        {src ? <Image src={src} alt="" fill sizes="44px" className="object-cover" /> : <ImageOff className="size-4 text-subtle" aria-hidden />}
                      </span>
                      <span>
                        <span className="block font-medium hover:underline">{p.name}</span>
                        <span className="text-xs text-muted">
                          {p.product_variants.length} variant{p.product_variants.length === 1 ? "" : "s"}
                          {p.is_featured && " · Featured"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">{formatMoney(p.min_price)}</td>
                  <td className={`px-4 py-3 tabular-nums ${p.total_stock === 0 ? "text-danger" : p.total_stock <= 5 ? "text-warning" : ""}`}>{p.total_stock}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted">
                  {q ? "No products match your search." : "No products yet. Add your first one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} makeHref={(n) => `/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`} />
    </div>
  );
}
