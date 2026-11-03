import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { CartProvider } from "@/components/store/cart-provider";
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: env.NEXT_PUBLIC_STORE_NAME, template: `%s · ${env.NEXT_PUBLIC_STORE_NAME}` },
  description: `Shop online at ${env.NEXT_PUBLIC_STORE_NAME}.`,
  openGraph: { siteName: env.NEXT_PUBLIC_STORE_NAME, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#3628a0",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Every page renders per-request so Next.js can apply the per-request CSP nonce
  // (set in src/proxy.ts) to its scripts.
  await connection();

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh font-sans">
        <CartProvider>{children}</CartProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
