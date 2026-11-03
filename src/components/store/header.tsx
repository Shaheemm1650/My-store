import { Suspense } from "react";
import Link from "next/link";
import { BadgePercent, Package } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { env } from "@/lib/env";
import { CartButton } from "./cart-button";
import { CategoryNav } from "./category-nav";
import { SearchBox } from "./search-box";
import { UserMenu } from "./user-menu";

export async function Header() {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_var(--color-line)]">
      {/* Announcement bar */}
      <div className="bg-brand text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-xs font-medium sm:justify-between sm:px-6">
          <p className="truncate">
            <span className="text-accent">●</span> Free delivery on every order · Pay easily by bank transfer
          </p>
          <nav className="hidden items-center gap-5 sm:flex" aria-label="Quick links">
            <Link href="/#how-it-works" className="opacity-90 hover:opacity-100">How to pay</Link>
            <Link href="/orders" className="opacity-90 hover:opacity-100">Track your order</Link>
          </nav>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-[72px] sm:gap-6 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${env.NEXT_PUBLIC_STORE_NAME} home`}>
          <Logo className="h-9 sm:h-10" priority />
          <span className="hidden text-lg font-bold tracking-tight text-brand md:inline">{env.NEXT_PUBLIC_STORE_NAME}</span>
        </Link>

        <div className="hidden flex-1 sm:block">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
          {user && (
            <Link href="/orders" className="hidden flex-col items-center rounded-lg px-3 py-1.5 text-muted transition hover:bg-canvas hover:text-ink lg:flex">
              <Package className="size-5" aria-hidden />
              <span className="text-[11px] font-medium">Orders</span>
            </Link>
          )}
          <UserMenu user={user ? { name: user.fullName ?? user.email ?? "Account", isAdmin: user.isAdmin } : null} />
          <CartButton />
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-3 sm:hidden">
        <Suspense>
          <SearchBox />
        </Suspense>
      </div>

      {/* Category navigation */}
      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Suspense>
            <CategoryNav categories={categories.map(({ id, name, slug }) => ({ id, name, slug }))}>
              <Link
                href="/products?sale=1"
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-danger hover:bg-red-50"
              >
                <BadgePercent className="size-4" aria-hidden /> Deals
              </Link>
            </CategoryNav>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
