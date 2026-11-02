"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FileImage, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadPaymentSlip } from "@/actions/orders";
import { compressImage } from "@/lib/compress-image";

export function SlipUpload({ orderId, replacing = false }: { orderId: string; replacing?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "compressing" | "uploading">("idle");
  const [, startTransition] = useTransition();

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    try {
      setStage("compressing");
      const compressed = await compressImage(selected, 0.8, 1800);
      if (preview) URL.revokeObjectURL(preview);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that image.");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setStage("idle");
    }
  }

  function onUpload() {
    if (!file) return;
    setStage("uploading");
    const fd = new FormData();
    fd.set("orderId", orderId);
    fd.set("file", file);
    startTransition(async () => {
      const result = await uploadPaymentSlip(fd);
      setStage("idle");
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Payment slip uploaded. We'll review it shortly.");
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      router.refresh();
    });
  }

  const busy = stage !== "idle";

  return (
    <div className="space-y-4">
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-canvas px-4 py-8 text-center transition hover:border-ink"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="Selected payment slip" className="max-h-64 rounded-md object-contain" />
        ) : (
          <>
            <FileImage className="size-8 text-subtle" aria-hidden />
            <span className="text-sm font-medium">{replacing ? "Choose a new slip image" : "Choose a photo or screenshot of your slip"}</span>
            <span className="text-xs text-muted">JPG, PNG or WebP · compressed automatically</span>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={onSelect} disabled={busy} />
      </label>
      {stage === "compressing" && <p className="text-xs text-muted">Optimising image…</p>}
      <button type="button" onClick={onUpload} disabled={!file || busy} className="btn-brand w-full py-3">
        {stage === "uploading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
        {stage === "uploading" ? "Uploading…" : replacing ? "Replace slip" : "Upload payment slip"}
      </button>
    </div>
  );
}
