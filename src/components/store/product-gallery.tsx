"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { cn, productImageUrl } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  if (!current) {
    return (
      <div className="card grid aspect-square place-items-center text-subtle">
        <ImageOff className="size-10" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Image ${i + 1} of ${images.length}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line transition md:size-20",
                i === index ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100",
              )}
            >
              <Image src={productImageUrl(img.storage_path)!} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden rounded-(--radius-card) bg-white ring-1 ring-line">
        <Image
          key={current.id}
          src={productImageUrl(current.storage_path)!}
          alt={current.alt || name}
          fill
          priority
          quality={85}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}
