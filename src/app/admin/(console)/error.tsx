"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-danger-bg text-danger"><RefreshCw className="size-7" /></span>
      <h1 className="mt-6 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">This page hit an unexpected problem. Your data is safe — try again, and if it keeps happening, tell the ManaBrand team.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-subtle">Ref: {error.digest}</p>}
      <Button onClick={reset} size="lg" className="mt-6">Try again</Button>
    </div>
  );
}
