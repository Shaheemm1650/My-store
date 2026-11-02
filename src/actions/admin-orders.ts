"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

const schema = z.object({
  orderId: z.uuid(),
  status: z.enum(["approved", "rejected", "delivered"]),
  note: z.string().trim().max(1000).optional(),
});

export async function updateOrderStatus(input: unknown): Promise<ActionResult> {
  await assertAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const { orderId, status, note } = parsed.data;
  if (status === "rejected" && !note) return { ok: false, error: "Please give a reason for rejecting." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_note: note ?? null,
  });

  if (error) {
    if (error.message?.startsWith("INVALID_TRANSITION")) {
      return { ok: false, error: "This status change isn't allowed from the order's current status." };
    }
    console.error("admin_update_order_status failed", error);
    return { ok: false, error: "Could not update the order." };
  }

  revalidatePath("/admin", "layout");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/products", "layout");
  return { ok: true };
}
