import { env, BUCKETS } from "./env";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const moneyFormatter = new Intl.NumberFormat(env.NEXT_PUBLIC_LOCALE, {
  style: "currency",
  currency: env.NEXT_PUBLIC_CURRENCY,
  minimumFractionDigits: 2,
});

/** Prices are stored as integer minor units (e.g. laari). */
export function formatMoney(minor: number | null | undefined) {
  return moneyFormatter.format((minor ?? 0) / 100);
}

export function toMinor(major: number) {
  return Math.round(major * 100);
}

export function toMajor(minor: number | null | undefined) {
  return minor == null ? "" : (minor / 100).toFixed(2);
}

export function formatDate(value: string | Date, withTime = true) {
  return new Intl.DateTimeFormat(env.NEXT_PUBLIC_LOCALE, {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(new Date(value));
}

export function productImageUrl(path: string | null | undefined) {
  if (!path) return null;
  // Bundled sample images (see supabase/seed.sql) are served from /public.
  if (path.startsWith("/")) return path;
  // External images (e.g. demo catalogue) must also be allowed in next.config.ts → images.remotePatterns.
  if (path.startsWith("https://")) return path;
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKETS.productImages}/${path}`;
}

export function formatOrderNumber(n: number | string) {
  return `#${n}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Only allow same-site relative redirects (prevents open-redirect attacks). */
export function safeRedirectPath(path: string | null | undefined, fallback = "/") {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
