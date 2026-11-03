import Link from "next/link";
import { Landmark, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { getCategories } from "@/lib/catalog";
import { env } from "@/lib/env";

export async function Footer() {
  const categories = await getCategories();

  return (
    <footer className="mt-16 bg-[#1b1450] text-white/75">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="rounded-xl bg-white p-2">
              <Logo className="h-9" />
            </span>
            <span className="text-lg font-bold text-white">{env.NEXT_PUBLIC_STORE_NAME}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Quality products at fair prices, delivered to your door. Pay safely by bank transfer and track your order online.
          </p>
        </div>

        <nav aria-label="Shop">
          <h2 className="mb-4 text-sm font-semibold text-white">Shop</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/products" className="hover:text-accent">All products</Link></li>
            <li><Link href="/products?sale=1" className="hover:text-accent">Deals</Link></li>
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}><Link href={`/products?category=${c.slug}`} className="hover:text-accent">{c.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Customer service">
          <h2 className="mb-4 text-sm font-semibold text-white">Customer service</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/orders" className="hover:text-accent">Track my order</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-accent">How to pay</Link></li>
            <li><Link href="/cart" className="hover:text-accent">Shopping cart</Link></li>
            <li><Link href="/login" className="hover:text-accent">Sign in / Register</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-white">Why shop with us</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2.5"><Truck className="size-4 text-accent" aria-hidden /> Free delivery</li>
            <li className="flex items-center gap-2.5"><Landmark className="size-4 text-accent" aria-hidden /> Bank transfer payment</li>
            <li className="flex items-center gap-2.5"><PackageCheck className="size-4 text-accent" aria-hidden /> Online order tracking</li>
            <li className="flex items-center gap-2.5"><ShieldCheck className="size-4 text-accent" aria-hidden /> Secure checkout</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {env.NEXT_PUBLIC_STORE_NAME}. All rights reserved.</p>
          <p className="flex items-center gap-2">
            We accept
            <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 font-medium text-white">
              <Landmark className="size-3.5" aria-hidden /> Bank transfer
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
