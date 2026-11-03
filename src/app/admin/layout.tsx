import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/ui/logo";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Admin", template: `%s · Admin · ${env.NEXT_PUBLIC_STORE_NAME}` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const supabase = await createClient();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "slip_uploaded");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-canvas p-4 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r lg:p-5">
        <div className="mb-4 flex items-center justify-between lg:mb-8">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8" />
            Admin
          </Link>
          <Link href="/" className="btn-ghost px-2 text-xs lg:hidden">
            Store <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
        <AdminNav pendingCount={count ?? 0} />
        <div className="mt-8 hidden border-t border-line pt-4 text-xs text-muted lg:block">
          <p className="truncate">{user.email}</p>
          <Link href="/" className="mt-2 inline-flex items-center gap-1 hover:text-ink">
            View store <ExternalLink className="size-3" aria-hidden />
          </Link>
        </div>
      </aside>
      <main className="min-w-0 bg-white p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
