import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>
      <CheckoutForm defaults={{ name: user.fullName ?? "", phone: user.phone ?? "" }} />
    </div>
  );
}
