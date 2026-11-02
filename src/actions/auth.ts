"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation";
import { safeRedirectPath } from "@/lib/utils";

export interface AuthFormState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Generic message — don't reveal whether the email exists.
  if (error) return { error: error.code === "email_not_confirmed" ? "Please confirm your email first." : "Invalid email or password." };

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(String(formData.get("next") ?? ""), "/"));
}

export async function signup(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
    },
  });

  if (error) {
    if (error.code === "weak_password") return { error: "Please choose a stronger password." };
    if (error.status === 429) return { error: "Too many attempts. Please wait a moment and try again." };
    return { error: "Could not create your account. Please try again." };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(safeRedirectPath(String(formData.get("next") ?? ""), "/"));
  }

  return { message: "Check your inbox to confirm your email, then sign in." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
