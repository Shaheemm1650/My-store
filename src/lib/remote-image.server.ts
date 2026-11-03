import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { ImageValidationError } from "@/lib/images.server";

const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;

/** True for loopback, private, link-local, CGNAT, multicast and other non-public ranges. */
function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v.startsWith("ff")) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateAddress(mapped[1]!) : false;
  }
  const [a, b] = ip.split(".").map(Number) as [number, number];
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

async function assertPublicUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ImageValidationError("That doesn't look like a valid link.");
  }
  if (url.protocol !== "https:") throw new ImageValidationError("Only https:// image links are allowed.");
  if (url.username || url.password) throw new ImageValidationError("Links with credentials are not allowed.");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (addresses.length === 0) throw new ImageValidationError("Couldn't reach that website.");
  if (addresses.some(isPrivateAddress)) throw new ImageValidationError("That address is not allowed.");
  return url;
}

/**
 * Downloads an image from a public https URL (admin-only feature) with SSRF protection:
 * private/internal addresses are refused (re-checked on every redirect), and both
 * time and size are capped. The result is then validated and re-encoded by processImage.
 */
export async function downloadImage(raw: string): Promise<File> {
  let url = await assertPublicUrl(raw.trim());

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" },
      cache: "no-store",
    }).catch(() => {
      throw new ImageValidationError("Couldn't download that image (timed out or refused).");
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString());
      continue;
    }
    if (!res.ok || !res.body) throw new ImageValidationError(`The website answered with an error (${res.status}).`);

    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (type && !type.startsWith("image/")) throw new ImageValidationError("That link isn't an image.");
    if (Number(res.headers.get("content-length") ?? 0) > MAX_BYTES) throw new ImageValidationError("Image is too large (max 8 MB).");

    // Stream with a hard cap — content-length can be missing or wrong.
    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new ImageValidationError("Image is too large (max 8 MB).");
      }
      chunks.push(value);
    }
    const name = url.pathname.split("/").pop() || "image";
    // Type left empty so processImage validates by decoding rather than trusting headers.
    return new File(chunks as BlobPart[], name, { type: "" });
  }
  throw new ImageValidationError("Too many redirects.");
}
