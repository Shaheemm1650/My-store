import { CategoryManager } from "@/components/admin/category-manager";
import { getCategories } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [categories, { data }] = await Promise.all([getCategories(), supabase.from("products").select("category_id")]);
  const counts: Record<string, number> = {};
  for (const p of data ?? []) if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <CategoryManager categories={categories} counts={counts} />
    </div>
  );
}
