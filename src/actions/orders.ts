"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { BUCKETS } from "@/lib/env";
import { ImageValidationError, processImage } from "@/lib/images.server";
import { uuidSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function uploadPaymentSlip(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const orderId = uuidSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) return { ok: false, error: "Invalid order." };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId.data)
    .maybeSingle();

  if (!order || order.user_id !== user.id) return { ok: false, error: "Order not found." };
  if (order.status !== "pending" && order.status !== "slip_uploaded") {
    return { ok: false, error: "This order can no longer accept a payment slip." };
  }

  let image;
  try {
    image = await processImage(formData.get("file"), "slip");
  } catch (e) {
    return { ok: false, error: e instanceof ImageValidationError ? e.message : "Could not process the image." };
  }

  const path = `${user.id}/${order.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.paymentSlips)
    .upload(path, image.buffer, { contentType: image.contentType, upsert: false });

  if (uploadError) {
    console.error("slip upload failed", uploadError);
    return { ok: false, error: "Upload failed. Please try again." };
  }

  const { error } = await supabase.rpc("attach_payment_slip", { p_order_id: order.id, p_path: path });
  if (error) {
    console.error("attach_payment_slip failed", error);
    return { ok: false, error: "Could not attach the slip to your order." };
  }

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/orders");
  return { ok: true };
}
