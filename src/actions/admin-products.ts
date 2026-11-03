"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth";
import { BUCKETS } from "@/lib/env";
import { z } from "zod";
import { ImageValidationError, processImage } from "@/lib/images.server";
import { downloadImage } from "@/lib/remote-image.server";
import { fieldErrors, productSchema, uuidSchema } from "@/lib/validation";
import { toMinor } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

function revalidateCatalog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  if (slug) revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
}

export async function saveProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  await assertAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  const p = parsed.data;

  const skus = p.variants.map((v) => v.sku).filter(Boolean);
  if (new Set(skus).size !== skus.length) return { ok: false, error: "Each variant SKU must be unique." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_save_product", {
    p: {
      id: p.id ?? null,
      name: p.name,
      slug: p.slug,
      description: p.description,
      category_id: p.categoryId ?? null,
      is_active: p.isActive,
      is_featured: p.isFeatured,
      variants: p.variants.map((v) => ({
        id: v.id ?? null,
        name: v.name,
        sku: v.sku || null,
        price: toMinor(v.price),
        compare_at_price: v.compareAtPrice ? toMinor(v.compareAtPrice) : null,
        stock: v.stock,
      })),
    },
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: error.message.includes("sku") ? "A variant SKU is already in use." : "That slug is already in use.",
      };
    }
    console.error("admin_save_product failed", error);
    return { ok: false, error: "Could not save the product." };
  }

  revalidateCatalog(p.slug);
  return { ok: true, data: { id: data as string } };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  await assertAdmin();
  const id = uuidSchema.safeParse(productId);
  if (!id.success) return { ok: false, error: "Invalid product." };

  const supabase = await createClient();
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", id.data);

  const { error } = await supabase.from("products").delete().eq("id", id.data);
  if (error) {
    console.error("delete product failed", error);
    return { ok: false, error: "Could not delete the product." };
  }

  // Order items keep their own name/price snapshots, so history is preserved.
  const stored = (images ?? []).map((i) => i.storage_path).filter((p) => !p.startsWith("/") && !p.startsWith("https://"));
  if (stored.length) {
    await supabase.storage.from(BUCKETS.productImages).remove(stored);
  }

  revalidateCatalog();
  return { ok: true };
}

type ProcessedImage = Awaited<ReturnType<typeof processImage>>;

/** Uploads a processed image to storage and appends it to the product's gallery. */
async function saveProductImage(productId: string, image: ProcessedImage): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("id, slug, name").eq("id", productId).maybeSingle();
  if (!product) return { ok: false, error: "Product not found." };

  const path = `${product.id}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.productImages)
    .upload(path, image.buffer, { contentType: image.contentType, cacheControl: "31536000", upsert: false });
  if (uploadError) {
    console.error("product image upload failed", uploadError);
    return { ok: false, error: "Upload failed. Has the storage setup (3_storage.sql) been run?" };
  }

  const { data: last } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", product.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_images").insert({
    product_id: product.id,
    storage_path: path,
    alt: product.name,
    width: image.width,
    height: image.height,
    position: (last?.position ?? -1) + 1,
  });
  if (error) {
    await supabase.storage.from(BUCKETS.productImages).remove([path]);
    return { ok: false, error: "Could not save the image." };
  }

  revalidateCatalog(product.slug);
  revalidatePath(`/admin/products/${product.id}`);
  return { ok: true };
}

export async function uploadProductImage(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const productId = uuidSchema.safeParse(formData.get("productId"));
  if (!productId.success) return { ok: false, error: "Invalid product." };

  try {
    return await saveProductImage(productId.data, await processImage(formData.get("file"), "product"));
  } catch (e) {
    return { ok: false, error: e instanceof ImageValidationError ? e.message : "Could not process the image." };
  }
}

const urlSchema = z.string().trim().url().max(2048);

/** Admin: import an image from a public https link (downloaded and compressed on the server). */
export async function importProductImageFromUrl(productId: string, url: string): Promise<ActionResult> {
  await assertAdmin();
  const id = uuidSchema.safeParse(productId);
  const link = urlSchema.safeParse(url);
  if (!id.success) return { ok: false, error: "Invalid product." };
  if (!link.success) return { ok: false, error: "Enter a valid image link." };

  try {
    const file = await downloadImage(link.data);
    return await saveProductImage(id.data, await processImage(file, "product"));
  } catch (e) {
    if (!(e instanceof ImageValidationError)) console.error("image import failed", e);
    return { ok: false, error: e instanceof ImageValidationError ? e.message : "Could not import that image." };
  }
}

export async function deleteProductImage(imageId: string): Promise<ActionResult> {
  await assertAdmin();
  const id = uuidSchema.safeParse(imageId);
  if (!id.success) return { ok: false, error: "Invalid image." };

  const supabase = await createClient();
  const { data: img } = await supabase
    .from("product_images")
    .select("id, storage_path, product_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!img) return { ok: false, error: "Image not found." };

  const { error } = await supabase.from("product_images").delete().eq("id", img.id);
  if (error) return { ok: false, error: "Could not delete the image." };
  if (!img.storage_path.startsWith("/") && !img.storage_path.startsWith("https://")) {
    await supabase.storage.from(BUCKETS.productImages).remove([img.storage_path]);
  }

  revalidateCatalog();
  revalidatePath(`/admin/products/${img.product_id}`);
  return { ok: true };
}

/** Moves an image one step left/right in the gallery order (position 0 = cover image). */
export async function moveProductImage(imageId: string, direction: "left" | "right"): Promise<ActionResult> {
  await assertAdmin();
  const id = uuidSchema.safeParse(imageId);
  if (!id.success) return { ok: false, error: "Invalid image." };

  const supabase = await createClient();
  const { data: img } = await supabase.from("product_images").select("product_id").eq("id", id.data).maybeSingle();
  if (!img) return { ok: false, error: "Image not found." };

  const { data: all } = await supabase
    .from("product_images")
    .select("id, position")
    .eq("product_id", img.product_id)
    .order("position")
    .order("created_at");
  const list = all ?? [];
  const idx = list.findIndex((i) => i.id === id.data);
  const swap = direction === "left" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= list.length) return { ok: true };

  [list[idx], list[swap]] = [list[swap]!, list[idx]!];
  await Promise.all(list.map((item, position) => supabase.from("product_images").update({ position }).eq("id", item.id)));

  revalidateCatalog();
  revalidatePath(`/admin/products/${img.product_id}`);
  return { ok: true };
}
