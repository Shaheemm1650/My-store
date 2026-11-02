import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Upload } from "lucide-react";
import { ProductGrid } from "@/components/store/product-card";
import { getCategories, searchProducts } from "@/lib/catalog";
import { env } from "@/lib/env";

export default async function HomePage() {
  const [categories, featured, latest] = await Promise.all([
    getCategories(),
    searchProducts({ featured: true }, 4),
    searchProducts({ sort: "newest" }, 8),
  ]);

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
              New arrivals every week
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Quality essentials, delivered to your door.
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted text-pretty">
              Shop {env.NEXT_PUBLIC_STORE_NAME}&apos;s curated collection. Pay by bank transfer and upload your receipt —
              we&apos;ll confirm and deliver.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary px-6 py-3">
                Shop now <ArrowRight className="size-4" aria-hidden />
              </Link>
              {categories[0] && (
                <Link href={`/products?category=${categories[0].slug}`} className="btn-secondary px-6 py-3">
                  Browse {categories[0].name}
                </Link>
              )}
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { icon: Truck, title: "Fast local delivery", text: "Orders are delivered once payment is confirmed." },
              { icon: Upload, title: "Simple payment", text: "Transfer to our bank account and upload the slip." },
              { icon: ShieldCheck, title: "Secure checkout", text: "Your data is protected end to end." },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="card flex items-start gap-4 p-5">
                <span className="rounded-lg bg-brand-soft p-2 text-brand">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight">Shop by category</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">Featured</h2>
          <ProductGrid products={featured.items} />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">New arrivals</h2>
          <Link href="/products" className="text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        </div>
        {latest.items.length > 0 ? (
          <ProductGrid products={latest.items} />
        ) : (
          <p className="text-sm text-muted">Products will appear here soon.</p>
        )}
      </section>
    </>
  );
}
