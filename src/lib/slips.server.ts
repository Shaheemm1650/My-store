import "server-only";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/env";

/** Short-lived signed URL for a private payment slip (RLS decides who may sign it). */
export async function getSlipUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKETS.paymentSlips).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
