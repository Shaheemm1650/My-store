"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  categories: { id: string; name: string; slug: string }[];
  children?: React.ReactNode;
}

export function CategoryNav({ categories, children }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const onProducts = pathname === "/products";
  const active = onProducts ? params.get("category") : null;
  const allActive = onProducts && !active && !params.get("sale") && !params.get("q");

  const item = (isActive: boolean) =>
    cn(
      "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
      isActive ? "bg-brand-soft text-brand" : "text-muted hover:bg-canvas hover:text-ink",
    );

  return (
    <nav className="-mx-1 flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none]" aria-label="Categories">
      <Link href="/products" className={cn(item(allActive), "flex items-center gap-1.5")}>
        <LayoutGrid className="size-4" aria-hidden /> All products
      </Link>
      {children}
      <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden />
      {categories.map((c) => (
        <Link key={c.id} href={`/products?category=${c.slug}`} className={item(active === c.slug)}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
