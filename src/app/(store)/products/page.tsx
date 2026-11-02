import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { Filters } from "@/components/store/filters";
import { ProductGrid } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getCategories, parseSearchParams, searchProducts, SORT_OPTIONS } from "@/lib/catalog";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams);
  return { title: q ? `Search: ${q}` : "Shop all products" };
}

export default async function ProductsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = parseSearchParams(raw);
  const [categories, result] = await Promise.all([getCategories(), searchProducts(params)]);
  const category = categories.find((c) => c.slug === params.category);

  const makeHref = (page: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) if (typeof v === "string" && k !== "page") sp.set(k, v);
    sp.set("page", String(page));
    return `/products?${sp}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {params.q ? <>Results for &ldquo;{params.q}&rdquo;</> : (category?.name ?? "All products")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {result.total} {result.total === 1 ? "product" : "products"}
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[230px_1fr] lg:gap-10">
        <Suspense>
          <Filters categories={categories} sortOptions={SORT_OPTIONS} />
        </Suspense>
        <div>
          {result.items.length > 0 ? (
            <>
              <ProductGrid products={result.items} />
              <Pagination page={result.page} totalPages={result.totalPages} makeHref={makeHref} />
            </>
          ) : (
            <EmptyState icon={PackageSearch} title="No products found" description="Try a different search or remove some filters." />
          )}
        </div>
      </div>
    </div>
  );
}
