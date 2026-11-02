"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If the problem continues, contact us.</p>
      {error.digest && <p className="mt-1 font-mono text-xs text-subtle">Ref: {error.digest}</p>}
      <button type="button" onClick={reset} className="btn-primary mt-8">Try again</button>
    </main>
  );
}
