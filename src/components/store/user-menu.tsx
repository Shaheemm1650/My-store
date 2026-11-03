"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, Package, User } from "lucide-react";
import { logout } from "@/actions/auth";

export function UserMenu({ user }: { user: { name: string; isAdmin: boolean } | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link href="/login" className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition hover:bg-canvas">
        <User className="size-6" aria-hidden />
        <span className="hidden flex-col leading-tight lg:flex">
          <span className="text-[11px] text-muted">Hello, sign in</span>
          <span className="text-sm font-semibold">Account</span>
        </span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition hover:bg-canvas"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <User className="size-6" aria-hidden />
        <span className="hidden max-w-32 flex-col leading-tight lg:flex">
          <span className="text-[11px] text-muted">Hello,</span>
          <span className="truncate text-sm font-semibold">{user.name.split(" ")[0]}</span>
        </span>
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 mt-2 w-56 overflow-hidden p-1 shadow-lg">
          <p className="truncate px-3 py-2 text-xs text-muted">{user.name}</p>
          <Link role="menuitem" href="/orders" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-canvas" onClick={() => setOpen(false)}>
            <Package className="size-4" aria-hidden /> My orders
          </Link>
          {user.isAdmin && (
            <Link role="menuitem" href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-canvas" onClick={() => setOpen(false)}>
              <LayoutDashboard className="size-4" aria-hidden /> Admin dashboard
            </Link>
          )}
          <form action={logout}>
            <button role="menuitem" type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-canvas">
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
