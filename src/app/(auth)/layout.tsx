import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { env } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex flex-col items-center gap-3 text-lg font-semibold tracking-tight">
        <Logo className="h-16" priority />
        {env.NEXT_PUBLIC_STORE_NAME}
      </Link>
      <main className="card w-full max-w-md p-6 shadow-sm sm:p-8">{children}</main>
    </div>
  );
}
