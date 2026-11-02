"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthFormState } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

function Field({ name, label, type = "text", autoComplete, errors, hint }: { name: string; label: string; type?: string; autoComplete?: string; errors?: string[]; hint?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} type={type} autoComplete={autoComplete} required className="input" aria-invalid={!!errors?.length} aria-describedby={errors?.length ? `${name}-error` : undefined} />
      {hint && !errors?.length && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {errors?.[0] && <p id={`${name}-error`} className="field-error">{errors[0]}</p>}
    </div>
  );
}

function Alert({ state }: { state: AuthFormState }) {
  if (state.error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-danger">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-lg bg-brand-soft p-3 text-sm text-brand">{state.message}</p>;
  return null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <Alert state={state} />
      <Field name="email" label="Email" type="email" autoComplete="email" errors={state.fieldErrors?.email} />
      <Field name="password" label="Password" type="password" autoComplete="current-password" errors={state.fieldErrors?.password} />
      <SubmitButton className="btn-primary w-full py-3" pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-ink underline">Create an account</Link>
      </p>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action] = useActionState(signup, {});
  if (state.message) return <Alert state={state} />;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <Alert state={state} />
      <Field name="fullName" label="Full name" autoComplete="name" errors={state.fieldErrors?.fullName} />
      <Field name="phone" label="Phone" type="tel" autoComplete="tel" errors={state.fieldErrors?.phone} />
      <Field name="email" label="Email" type="email" autoComplete="email" errors={state.fieldErrors?.email} />
      <Field name="password" label="Password" type="password" autoComplete="new-password" errors={state.fieldErrors?.password} hint="At least 8 characters, with a letter and a number." />
      <SubmitButton className="btn-primary w-full py-3" pendingText="Creating account…">Create account</SubmitButton>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-ink underline">Sign in</Link>
      </p>
    </form>
  );
}
