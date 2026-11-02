import type { Metadata } from "next";
import { LoginForm } from "@/components/store/auth-forms";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Sign in to checkout and track your orders.</p>
      {error === "confirm" && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-danger">That confirmation link is invalid or has expired.</p>
      )}
      <LoginForm next={safeRedirectPath(next)} />
    </>
  );
}
