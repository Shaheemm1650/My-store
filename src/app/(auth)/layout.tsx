import Link from "next/link";
import { env } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="grid size-9 place-items-center rounded-lg bg-brand text-white" aria-hidden>
          {env.NEXT_PUBLIC_STORE_NAME.charAt(0)}
        </span>
        {env.NEXT_PUBLIC_STORE_NAME}
      </Link>
      <main className="card w-full max-w-md p-6 shadow-sm sm:p-8">{children}</main>
    </div>
  );
}
