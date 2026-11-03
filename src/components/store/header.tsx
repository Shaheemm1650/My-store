import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { Logo } from "@/components/ui/logo";
import { CartButton } from "./cart-button";
import { SearchBox } from "./search-box";
import { UserMenu } from "./user-menu";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <Logo className="h-9" priority />
          <span className="hidden sm:inline">{env.NEXT_PUBLIC_STORE_NAME}</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Main">
          <Link href="/products" className="btn-ghost px-3">
            Shop all
          </Link>
          {user && (
            <Link href="/orders" className="btn-ghost px-3">
              My orders
            </Link>
          )}
        </nav>

        <div className="hidden flex-1 justify-center sm:flex">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <UserMenu user={user ? { name: user.fullName ?? user.email ?? "Account", isAdmin: user.isAdmin } : null} />
          <CartButton />
        </div>
      </div>
      <div className="border-t border-line px-4 py-2 sm:hidden">
        <Suspense>
          <SearchBox />
        </Suspense>
      </div>
    </header>
  );
}
