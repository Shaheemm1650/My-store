"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  categories: Pick<Category, "id" | "name" | "slug">[];
  sortOptions: ReadonlyArray<{ value: string; label: string }>;
}

export function Filters({ categories, sortOptions }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page"); // any filter change resets pagination
    startTransition(() => router.push(`/products${next.size ? `?${next}` : ""}`, { scroll: false }));
  }

  function onPriceSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    update({ min: String(fd.get("min") || "") || null, max: String(fd.get("max") || "") || null });
  }

  const active = params.get("category");
  const hasFilters = ["category", "min", "max", "stock", "q"].some((k) => params.has(k));

  const body = (
    <div className={cn("space-y-8", pending && "opacity-60 transition-opacity")}>
      <div>
        <label htmlFor="sort" className="label">
          Sort by
        </label>
        <select
          id="sort"
          className="input"
          value={params.get("sort") ?? (params.get("q") ? "relevance" : "newest")}
          onChange={(e) => update({ sort: e.target.value })}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="label">Category</legend>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => update({ category: null })}
              className={cn("w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-white", !active && "bg-white font-medium ring-1 ring-line")}
            >
              All products
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => update({ category: c.slug })}
                aria-pressed={active === c.slug}
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-white",
                  active === c.slug && "bg-white font-medium ring-1 ring-line",
                )}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <form onSubmit={onPriceSubmit} key={`${params.get("min")}-${params.get("max")}`}>
        <fieldset>
          <legend className="label">Price</legend>
          <div className="flex items-center gap-2">
            <input name="min" type="number" min={0} step="any" inputMode="decimal" placeholder="Min" defaultValue={params.get("min") ?? ""} className="input" aria-label="Minimum price" />
            <span className="text-subtle">–</span>
            <input name="max" type="number" min={0} step="any" inputMode="decimal" placeholder="Max" defaultValue={params.get("max") ?? ""} className="input" aria-label="Maximum price" />
          </div>
          <button type="submit" className="btn-secondary mt-2 w-full">
            Apply
          </button>
        </fieldset>
      </form>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-(--color-brand)"
          checked={params.get("stock") === "1"}
          onChange={(e) => update({ stock: e.target.checked ? "1" : null })}
        />
        In stock only
      </label>

      {hasFilters && (
        <button type="button" onClick={() => startTransition(() => router.push("/products"))} className="btn-ghost -ml-2 px-2 text-danger">
          <X className="size-4" aria-hidden /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <details className="card mb-6 p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4" aria-hidden /> Filters & sorting
        </summary>
        <div className="mt-5">{body}</div>
      </details>
      <aside className="hidden lg:block">{body}</aside>
    </>
  );
}
