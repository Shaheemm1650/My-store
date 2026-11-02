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
    <form role="search" onSubmit={onSubmit} className="relative w-full sm:max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        key={params.get("q") ?? ""}
        name="q"
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search products…"
        aria-label="Search products"
        maxLength={100}
        className="input rounded-full bg-canvas pl-9"
      />
    </form>
  );
}
