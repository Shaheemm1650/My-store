import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  CreditCard,
  Dumbbell,
  Headphones,
  Home,
  Landmark,
  PackageCheck,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  Upload,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { discountPercent, ProductGrid } from "@/components/store/product-card";
import { getCategories, searchProducts } from "@/lib/catalog";
import { env } from "@/lib/env";
import type { ProductCardData } from "@/lib/types";
import { formatMoney, productImageUrl } from "@/lib/utils";

/** Picks an icon for a category from words in its slug; falls back to a tag. */
const CATEGORY_ICONS: [RegExp, LucideIcon][] = [
  [/cloth|apparel|fashion|wear|shirt/, Shirt],
  [/access|bag|jewel/, Watch],
  [/home|kitchen|living|decor/, Home],
  [/electr|tech|audio|phone|gadget/, Headphones],
  [/sport|outdoor|fitness|gym/, Dumbbell],
  [/beauty|care|cosmetic/, Sparkles],
  [/grocer|food|shop/, ShoppingBag],
];
const TILE_STYLES = [
  "bg-brand-soft text-brand",
  "bg-accent-soft text-[#047f81]",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-emerald-50 text-emerald-700",
  "bg-sky-50 text-sky-700",
];
const iconFor = (slug: string) => CATEGORY_ICONS.find(([re]) => re.test(slug))?.[1] ?? Tag;

function SectionHeader({ title, subtitle, href, linkText = "See all" }: { title: string; subtitle?: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
          {linkText} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function HeroCollage({ products }: { products: ProductCardData[] }) {
  const shots = products.filter((p) => p.image_path).slice(0, 3);
  if (shots.length === 0) return null;
  const positions = [
    "right-[34%] top-6 w-[46%] rotate-[-6deg]",
    "right-4 top-16 w-[42%] rotate-[5deg]",
    "right-[18%] bottom-4 w-[40%] rotate-[2deg]",
  ];
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block" aria-hidden>
      {shots.map((p, i) => (
        <div key={p.id} className={`absolute aspect-square overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl shadow-black/30 ${positions[i]}`}>
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <Image src={productImageUrl(p.image_path)!} alt="" fill sizes="240px" className="object-cover" priority={i === 0} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [categories, featured, deals, latest] = await Promise.all([
    getCategories(),
    searchProducts({ featured: true }, 10),
    searchProducts({ onSale: true, sort: "newest" }, 10),
    searchProducts({ sort: "newest" }, 10),
  ]);

  // Older databases (before the storefront_v2 migration) ignore the sale filter, so double-check here.
  const dealItems = deals.items.filter((p) => discountPercent(p) > 0);
  const maxOff = Math.max(0, ...dealItems.map(discountPercent));
  const heroProducts = featured.items.length ? featured.items : latest.items;
  const cheapest = Math.min(...latest.items.map((p) => p.min_price ?? Infinity));

  return (
    <div className="pb-6">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="relative min-h-[300px] overflow-hidden rounded-3xl bg-brand px-6 py-10 text-white sm:min-h-[380px] sm:px-10 sm:py-14">
            <div className="absolute -right-16 -top-20 size-72 rounded-full bg-accent/25 blur-2xl" aria-hidden />
            <div className="absolute -bottom-24 left-1/3 size-80 rounded-full bg-[#5a4bd1] blur-3xl" aria-hidden />
            <svg className="absolute bottom-0 left-0 h-24 w-48 text-accent/30" viewBox="0 0 200 100" aria-hidden>
              <path d="M0 100 L100 0 L130 30 L60 100 Z" fill="currentColor" />
            </svg>
            <HeroCollage products={heroProducts} />
            <div className="relative max-w-md">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Sparkles className="size-3.5 text-accent" aria-hidden /> New season collection
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl">
                Everything you love, <span className="text-accent">delivered.</span>
              </h1>
              <p className="mt-4 text-base text-white/80 text-pretty">
                Shop clothing, accessories, home and tech at {env.NEXT_PUBLIC_STORE_NAME}
                {Number.isFinite(cheapest) ? ` — prices from ${formatMoney(cheapest)}` : ""}.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/products" className="btn bg-accent px-6 py-3 font-semibold text-ink hover:bg-white">
                  Shop now <ArrowRight className="size-4" aria-hidden />
                </Link>
                {dealItems.length > 0 && (
                  <Link href="/products?sale=1" className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">
                    View deals
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
            <Link href="/products?sale=1" className="group relative overflow-hidden rounded-3xl bg-accent p-4 text-ink sm:p-6">
              <BadgePercent className="absolute -bottom-4 -right-4 size-24 text-white/40 sm:size-32 transition group-hover:rotate-12" aria-hidden />
              <p className="text-xs font-bold uppercase tracking-widest">Limited time</p>
              <p className="mt-2 text-xl font-bold leading-tight sm:text-3xl">{maxOff > 0 ? <>Up to {maxOff}% off</> : <>Hot deals</>}</p>
              <p className="mt-1 text-xs text-ink/70 sm:text-sm">On selected items</p>
              <span className="mt-3 inline-flex sm:mt-5 items-center gap-1 text-sm font-semibold underline-offset-4 group-hover:underline">
                Shop deals <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
            <Link href="/products?sort=newest" className="group relative overflow-hidden rounded-3xl bg-ink p-4 text-white sm:p-6">
              <Sparkles className="absolute -bottom-4 -right-4 size-24 text-white/10 sm:size-32 transition group-hover:scale-110" aria-hidden />
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Just landed</p>
              <p className="mt-2 text-xl font-bold leading-tight sm:text-3xl">New arrivals</p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">Fresh picks every week</p>
              <span className="mt-3 inline-flex sm:mt-5 items-center gap-1 text-sm font-semibold underline-offset-4 group-hover:underline">
                Explore <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <ul className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4 sm:p-5 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Free delivery", text: "On every order" },
            { icon: Landmark, title: "Bank transfer", text: "Pay & upload your slip" },
            { icon: PackageCheck, title: "Order tracking", text: "Follow every step" },
            { icon: ShieldCheck, title: "Secure shopping", text: "Your data is protected" },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block truncate text-xs text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <SectionHeader title="Shop by category" href="/products" linkText="All products" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            {categories.slice(0, 12).map((c, i) => {
              const Icon = iconFor(c.slug);
              return (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md"
                >
                  <span className={`grid size-14 place-items-center rounded-full transition group-hover:scale-110 sm:size-16 ${TILE_STYLES[i % TILE_STYLES.length]}`}>
                    <Icon className="size-6 sm:size-7" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold leading-tight sm:text-sm">{c.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Deals */}
      {dealItems.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 p-4 sm:p-6">
            <SectionHeader title="🔥 Today's deals" subtitle="Grab them before they're gone" href="/products?sale=1" />
            <ProductGrid products={dealItems.slice(0, 5)} columns="wide" />
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.items.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <SectionHeader title="Popular right now" subtitle="Our customers' favourites" href="/products" />
          <ProductGrid products={featured.items.slice(0, 5)} columns="wide" />
        </section>
      )}

      {/* How to pay */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-40 px-4 pt-12 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="grid lg:grid-cols-[1fr_2fr]">
            <div className="bg-brand-soft p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-brand">Simple & secure</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">How to order</h2>
              <p className="mt-2 text-sm text-muted">No card needed. Pay by bank transfer and we&apos;ll handle the rest.</p>
            </div>
            <ol className="grid gap-6 p-6 sm:grid-cols-3 sm:p-8">
              {[
                { icon: ShoppingBag, title: "Add to cart", text: "Pick your items and check out with your delivery details." },
                { icon: CreditCard, title: "Transfer & upload", text: "Send the total to our bank account and upload the receipt." },
                { icon: Truck, title: "We deliver", text: "We confirm your payment and deliver to your door." },
              ].map(({ icon: Icon, title, text }, i) => (
                <li key={title}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                    <Icon className="size-5 text-brand" aria-hidden />
                  </div>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
        <SectionHeader title="New arrivals" subtitle="The latest additions to our store" href="/products?sort=newest" />
        {latest.items.length > 0 ? (
          <ProductGrid products={latest.items} columns="wide" />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            <Upload className="mx-auto size-8 text-subtle" aria-hidden />
            <p className="mt-3 font-medium">Products are coming soon</p>
            <p className="mt-1 text-sm text-muted">Check back shortly — we&apos;re stocking the shelves.</p>
          </div>
        )}
      </section>
    </div>
  );
}
