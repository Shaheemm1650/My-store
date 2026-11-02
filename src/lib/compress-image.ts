"use client";

import imageCompression from "browser-image-compression";

/**
 * Shrinks an image in the browser before upload so requests are fast and stay
 * under serverless body limits. The server re-validates and re-encodes anyway.
 */
export async function compressImage(file: File, maxSizeMB = 1, maxWidthOrHeight = 2000): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 25 * 1024 * 1024) throw new Error("Image is too large (max 25 MB).");

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.85,
    });
    return new File([compressed], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    // Fall back to the original (e.g. a format the browser can't decode); the server will validate it.
    return file;
  }
}
