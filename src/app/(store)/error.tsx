"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-danger-bg text-danger"><RefreshCw className="size-7" /></span>
      <h1 className="mt-6 font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">We hit an unexpected snag. Please try again — your bag is safe.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-subtle">Ref: {error.digest}</p>}
      <Button onClick={reset} size="lg" className="mt-6 rounded-full">Try again</Button>
    </div>
  );
}
