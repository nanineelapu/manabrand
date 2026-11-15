"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

export function CopyCode({ code, className }: { code: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(code); } catch { /* clipboard blocked: still confirm visually */ }
      setDone(true); toast.success(`${code} copied`); setTimeout(() => setDone(false), 1800);
    }} className={cn("inline-flex h-11 items-center gap-2 rounded-full border-2 border-dashed border-current px-5 font-mono text-sm font-bold tracking-widest", className)}>
      {code}{done ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}
