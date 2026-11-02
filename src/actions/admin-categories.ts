"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth";
import { categorySchema, fieldErrors, uuidSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function saveCategory(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = categorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const { id, name, slug, description, sortOrder } = parsed.data;
  const supabase = await createClient();
  const row = { name, slug, description: description || null, sort_order: sortOrder };
  const { error } = id
    ? await supabase.from("categories").update(row).eq("id", id)
    : await supabase.from("categories").insert(row);

  if (error) {
    return { ok: false, error: error.code === "23505" ? "That slug is already in use." : "Could not save the category." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  await assertAdmin();
  const id = uuidSchema.safeParse(categoryId);
  if (!id.success) return { ok: false, error: "Invalid category." };

  const supabase = await createClient();
  // Products in this category become uncategorised (ON DELETE SET NULL).
  const { error } = await supabase.from("categories").delete().eq("id", id.data);
  if (error) return { ok: false, error: "Could not delete the category." };

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true };
}
