import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_STORE_NAME: z.string().min(1).default("My Store"),
  NEXT_PUBLIC_CURRENCY: z.string().length(3).default("MVR"),
  NEXT_PUBLIC_LOCALE: z.string().min(2).default("en-MV"),
});

// NEXT_PUBLIC_* vars must be referenced literally so Next.js can inline them in the browser bundle.
const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_STORE_NAME: process.env.NEXT_PUBLIC_STORE_NAME || undefined,
  NEXT_PUBLIC_CURRENCY: process.env.NEXT_PUBLIC_CURRENCY || undefined,
  NEXT_PUBLIC_LOCALE: process.env.NEXT_PUBLIC_LOCALE || undefined,
});

if (!parsed.success) {
  throw new Error(
    "Invalid environment variables. Copy .env.example to .env.local and fill it in.\n" +
      z.prettifyError(parsed.error),
  );
}

export const env = parsed.data;

export const BUCKETS = {
  productImages: "product-images",
  paymentSlips: "payment-slips",
} as const;
