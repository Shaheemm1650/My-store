"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct, saveProduct } from "@/actions/admin-products";
import type { Category, ProductVariant, ProductWithRelations } from "@/lib/types";
import { slugify, toMajor } from "@/lib/utils";

interface VariantRow {
  key: string;
  id?: string;
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
}

const toRow = (v: ProductVariant): VariantRow => ({
  key: v.id,
  id: v.id,
  name: v.name,
  sku: v.sku ?? "",
  price: toMajor(v.price),
  compareAtPrice: toMajor(v.compare_at_price),
  stock: String(v.stock),
});

const emptyRow = (name = "Default"): VariantRow => ({ key: crypto.randomUUID(), name, sku: "", price: "", compareAtPrice: "", stock: "0" });

export function ProductForm({ product, categories }: { product?: ProductWithRelations; categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [variants, setVariants] = useState<VariantRow[]>(product?.product_variants.length ? product.product_variants.map(toRow) : [emptyRow()]);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const updateVariant = (key: string, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

    startTransition(async () => {
      const result = await saveProduct({
        id: product?.id,
        name,
        slug,
        description: String(fd.get("description") ?? ""),
        categoryId: (fd.get("categoryId") as string) || null,
        isActive: fd.get("isActive") === "on",
        isFeatured: fd.get("isFeatured") === "on",
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: num(v.price),
          compareAtPrice: v.compareAtPrice.trim() ? num(v.compareAtPrice) : null,
          stock: num(v.stock),
        })),
      });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      setErrors({});
      toast.success(product ? "Product saved" : "Product created — now add some images");
      if (!product) router.push(`/admin/products/${result.data.id}`);
      else router.refresh();
    });
  }

  function onDelete() {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"? This cannot be undone. Past orders keep their details.`)) return;
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Product deleted");
      router.push("/admin/products");
    });
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <section className="card space-y-5 p-5 sm:p-6">
        <h2 className="font-semibold">Details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input
              id="name"
              value={name}
              maxLength={160}
              required
              className="input"
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
            {err("name") && <p className="field-error">{err("name")}</p>}
          </div>
          <div>
            <label htmlFor="slug" className="label">URL slug</label>
            <input
              id="slug"
              value={slug}
              maxLength={80}
              required
              className="input font-mono"
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
            />
            {err("slug") ? <p className="field-error">{err("slug")}</p> : <p className="mt-1 text-xs text-muted">/products/{slug || "…"}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" name="description" rows={6} maxLength={5000} defaultValue={product?.description} className="input" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="categoryId" className="label">Category</label>
            <select id="categoryId" name="categoryId" defaultValue={product?.category_id ?? ""} className="input">
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-3 pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={product?.is_active ?? true} className="size-4 accent-(--color-brand)" />
              Visible in store
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={product?.is_featured ?? false} className="size-4 accent-(--color-brand)" />
              Featured on home page
            </label>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Variants, pricing & stock</h2>
            <p className="text-xs text-muted">Use one &ldquo;Default&rdquo; variant for simple products, or add sizes/colours.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setVariants((v) => [...v, emptyRow("")])}>
            <Plus className="size-4" aria-hidden /> Add variant
          </button>
        </div>
        {err("variants") && <p className="field-error mb-3">{err("variants")}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="pb-2 pr-2 font-medium">Name</th>
                <th className="pb-2 pr-2 font-medium">SKU</th>
                <th className="pb-2 pr-2 font-medium">Price</th>
                <th className="pb-2 pr-2 font-medium">Compare-at</th>
                <th className="pb-2 pr-2 font-medium">Stock</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.key}>
                  <td className="py-1 pr-2"><input aria-label="Variant name" value={v.name} maxLength={80} placeholder="e.g. Large / Blue" className="input" onChange={(e) => updateVariant(v.key, { name: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input aria-label="SKU" value={v.sku} maxLength={64} className="input font-mono" onChange={(e) => updateVariant(v.key, { sku: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input aria-label="Price" type="number" min={0} step="0.01" inputMode="decimal" value={v.price} className="input" onChange={(e) => updateVariant(v.key, { price: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input aria-label="Compare-at price" type="number" min={0} step="0.01" inputMode="decimal" value={v.compareAtPrice} placeholder="Optional" className="input" onChange={(e) => updateVariant(v.key, { compareAtPrice: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input aria-label="Stock" type="number" min={0} step={1} inputMode="numeric" value={v.stock} className="input w-24" onChange={(e) => updateVariant(v.key, { stock: e.target.value })} /></td>
                  <td className="py-1">
                    <button type="button" className="btn-ghost px-2" aria-label="Remove variant" disabled={variants.length === 1} onClick={() => setVariants((rows) => rows.filter((r) => r.key !== v.key))}>
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {product ? (
          <button type="button" onClick={onDelete} disabled={pending} className="btn-ghost text-danger">
            <Trash2 className="size-4" aria-hidden /> Delete product
          </button>
        ) : (
          <span />
        )}
        <button type="submit" disabled={pending} className="btn-primary px-6">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
