import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/catalog";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Products
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
