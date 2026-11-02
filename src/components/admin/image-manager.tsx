"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProductImage, moveProductImage, uploadProductImage } from "@/actions/admin-products";
import { compressImage } from "@/lib/compress-image";
import type { ProductImage } from "@/lib/types";
import { productImageUrl } from "@/lib/utils";

const MAX_IMAGES = 12;

export function ImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - images.length);
    if (inputRef.current) inputRef.current.value = "";
    if (!files.length) return;

    setUploading({ done: 0, total: files.length });
    let failed = 0;
    // One request per image keeps each upload small and well under body limits.
    for (const [i, file] of files.entries()) {
      try {
        const compressed = await compressImage(file, 1, 2000);
        const fd = new FormData();
        fd.set("productId", productId);
        fd.set("file", compressed);
        const result = await uploadProductImage(fd);
        if (!result.ok) {
          failed++;
          toast.error(`${file.name}: ${result.error}`);
        }
      } catch (err) {
        failed++;
        toast.error(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
      setUploading({ done: i + 1, total: files.length });
    }
    setUploading(null);
    if (failed < files.length) toast.success(`${files.length - failed} image(s) uploaded`);
    router.refresh();
  }

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Something went wrong");
      router.refresh();
    });

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Images</h2>
          <p className="text-xs text-muted">First image is the cover. Images are compressed to WebP automatically.</p>
        </div>
        <span className="text-xs text-muted">{images.length}/{MAX_IMAGES}</span>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-canvas ring-1 ring-line">
            <Image src={productImageUrl(img.storage_path)!} alt={img.alt ?? ""} fill sizes="200px" className="object-cover" />
            {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <div className="flex gap-1">
                <button type="button" disabled={pending || i === 0} onClick={() => run(() => moveProductImage(img.id, "left"))} className="rounded bg-white/90 p-1 disabled:opacity-40" aria-label="Move left">
                  <ChevronLeft className="size-4" />
                </button>
                <button type="button" disabled={pending || i === images.length - 1} onClick={() => run(() => moveProductImage(img.id, "right"))} className="rounded bg-white/90 p-1 disabled:opacity-40" aria-label="Move right">
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => confirm("Delete this image?") && run(() => deleteProductImage(img.id))}
                className="rounded bg-white/90 p-1 text-danger"
                aria-label="Delete image"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {images.length < MAX_IMAGES && (
          <li>
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line text-sm text-muted transition hover:border-ink hover:text-ink">
              {uploading ? (
                <>
                  <Loader2 className="size-6 animate-spin" aria-hidden />
                  {uploading.done}/{uploading.total}
                </>
              ) : (
                <>
                  <ImagePlus className="size-6" aria-hidden />
                  Add images
                </>
              )}
              <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={onFiles} disabled={!!uploading} />
            </label>
          </li>
        )}
      </ul>
    </section>
  );
}
