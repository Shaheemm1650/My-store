import type { Metadata } from "next";
import { SignupForm } from "@/components/store/auth-forms";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mb-6 mt-1 text-sm text-muted">It only takes a minute.</p>
      <SignupForm next={safeRedirectPath(next)} />
    </>
  );
}
