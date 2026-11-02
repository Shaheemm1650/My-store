import Link from "next/link";
import { env } from "@/lib/env";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {env.NEXT_PUBLIC_STORE_NAME}. All rights reserved.
        </p>
        <nav className="flex gap-6" aria-label="Footer">
          <Link href="/products" className="hover:text-ink">Shop</Link>
          <Link href="/orders" className="hover:text-ink">Orders</Link>
          <Link href="/cart" className="hover:text-ink">Cart</Link>
        </nav>
      </div>
    </footer>
  );
}
