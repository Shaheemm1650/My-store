"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, saveCategory } from "@/actions/admin-categories";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult, Category } from "@/lib/types";
import { slugify } from "@/lib/utils";

function CategoryForm({ category, onDone }: { category?: Category; onDone?: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [state, action] = useActionState(async (prev: ActionResult | null, formData: FormData) => {
    const result = await saveCategory(prev, formData);
    if (result.ok) {
      toast.success(category ? "Category updated" : "Category added");
      if (!category) {
        setName("");
        setSlug("");
      }
      onDone?.();
    } else {
      toast.error(result.error);
    }
    return result;
  }, null);

  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_90px_auto] sm:items-start">
      {category && <input type="hidden" name="id" value={category.id} />}
      <div>
        <input
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!category) setSlug(slugify(e.target.value));
          }}
          placeholder="Name"
          aria-label="Category name"
          maxLength={80}
          required
          className="input"
        />
        {fe?.name && <p className="field-error">{fe.name[0]}</p>}
      </div>
      <div>
        <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="slug" aria-label="Slug" maxLength={80} required className="input font-mono" />
        {fe?.slug && <p className="field-error">{fe.slug[0]}</p>}
      </div>
      <input name="sortOrder" type="number" defaultValue={category?.sort_order ?? 0} aria-label="Sort order" title="Sort order" className="input" />
      <input type="hidden" name="description" value={category?.description ?? ""} />
      <div className="flex gap-2">
        <SubmitButton className="btn-primary">{category ? "Save" : "Add"}</SubmitButton>
        {onDone && category && (
          <button type="button" className="btn-ghost px-2" onClick={onDone} aria-label="Cancel">
            <X className="size-4" />
          </button>
        )}
      </div>
    </form>
  );
}

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Add category</h2>
        <CategoryForm />
      </section>

      <section className="card divide-y divide-line">
        {categories.map((c) =>
          editing === c.id ? (
            <div key={c.id} className="p-4">
              <CategoryForm category={c} onDone={() => setEditing(null)} />
            </div>
          ) : (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="font-mono text-xs text-muted">/{c.slug} · order {c.sort_order}</p>
              </div>
              <span className="text-xs text-muted">{counts[c.id] ?? 0} products</span>
              <button type="button" className="btn-ghost px-2" onClick={() => setEditing(c.id)} aria-label={`Edit ${c.name}`}>
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                className="btn-ghost px-2 text-danger"
                disabled={pending}
                aria-label={`Delete ${c.name}`}
                onClick={() => {
                  if (!confirm(`Delete "${c.name}"? Its products will become uncategorised.`)) return;
                  startTransition(async () => {
                    const r = await deleteCategory(c.id);
                    if (r.ok) toast.success("Category deleted");
                    else toast.error(r.error);
                  });
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ),
        )}
        {categories.length === 0 && <p className="p-8 text-center text-sm text-muted">No categories yet.</p>}
      </section>
    </div>
  );
}
