"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function placeOrder(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to place your order." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const { customerName, phone, address, notes, items } = parsed.data;
  const supabase = await createClient();

  // Prices and stock are computed inside the database — the client only sends variant IDs and quantities.
  const { data, error } = await supabase.rpc("place_order", {
    p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
    p_customer_name: customerName,
    p_phone: phone,
    p_address: address,
    p_notes: notes,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.startsWith("OUT_OF_STOCK:")) {
      return { ok: false, error: `Not enough stock for ${msg.slice("OUT_OF_STOCK:".length)}. Please update your cart.` };
    }
    if (msg.includes("PRODUCT_UNAVAILABLE")) return { ok: false, error: "An item in your cart is no longer available." };
    if (msg.includes("TOO_MANY_OPEN_ORDERS")) {
      return { ok: false, error: "You have too many unpaid orders. Please complete or wait for review of existing orders." };
    }
    console.error("place_order failed", error);
    return { ok: false, error: "Could not place your order. Please try again." };
  }

  // Remember delivery details for next time.
  await supabase.from("profiles").update({ full_name: customerName, phone }).eq("id", user.id);

  revalidatePath("/orders");
  revalidatePath("/admin", "layout");
  return { ok: true, data: { orderId: data as string } };
}
