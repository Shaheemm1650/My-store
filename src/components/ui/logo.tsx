import Image from "next/image";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";

/** Store logo (public/logo.png). Set the height with className, e.g. "h-8"; width follows the aspect ratio. */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt={env.NEXT_PUBLIC_STORE_NAME}
      width={300}
      height={400}
      priority={priority}
      sizes="64px"
      className={cn("h-8 w-auto", className)}
    />
  );
}
