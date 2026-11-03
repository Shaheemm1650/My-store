import "server-only";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // hard cap per request (client already compresses)
const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif"]);

export type ImagePreset = "product" | "slip";

const PRESETS: Record<ImagePreset, { maxSize: number; quality: number }> = {
  // Product photos: crisp enough for zoom on retina screens.
  product: { maxSize: 1600, quality: 80 },
  // Payment slips: must stay legible but are rarely viewed — compress harder.
  slip: { maxSize: 1600, quality: 72 },
};

export class ImageValidationError extends Error {}

/**
 * Validates an uploaded file is a real image (by decoding it — the client-supplied
 * MIME type is never trusted), strips all metadata (EXIF/GPS), auto-rotates,
 * resizes and re-encodes to WebP. Typical output: 80–300 KB.
 */
export async function processImage(file: unknown, preset: ImagePreset) {
  if (!(file instanceof File)) throw new ImageValidationError("No file provided.");
  if (file.size === 0) throw new ImageValidationError("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new ImageValidationError("Image is too large (max 8 MB).");
  if (file.type && !ACCEPTED_MIME.has(file.type)) throw new ImageValidationError("Unsupported file type.");

  const input = Buffer.from(await file.arrayBuffer());
  const { maxSize, quality } = PRESETS[preset];

  try {
    // limitInputPixels guards against decompression-bomb images.
    const pipeline = sharp(input, { limitInputPixels: 40_000_000, failOn: "error" })
      .rotate()
      .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    return { buffer: data, width: info.width, height: info.height, contentType: "image/webp" as const };
  } catch {
    throw new ImageValidationError("Could not read the image. Please upload a JPG, PNG or WebP file.");
  }
}
