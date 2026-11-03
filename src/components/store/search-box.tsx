"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    router.push(`/products${next.size ? `?${next}` : ""}`);
  }

  return (
    <form role="search" onSubmit={onSubmit} className="flex w-full overflow-hidden rounded-full border-2 border-brand bg-white focus-within:ring-4 focus-within:ring-brand/15">
      <input
        key={params.get("q") ?? ""}
        name="q"
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search for products, brands and more…"
        aria-label="Search products"
        maxLength={100}
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-subtle"
      />
      <button type="submit" className="flex items-center gap-2 bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-dark sm:px-6" aria-label="Search">
        <Search className="size-4" aria-hidden />
        <span className="hidden md:inline">Search</span>
      </button>
    </form>
  );
}
