"use client";

import Link from "next/link";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { useToast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const icon = { success: CheckCircle2, error: XCircle, info: Info };
const tint = { success: "text-[#7fd6a8]", error: "text-[#ff9d8f]", info: "text-[#9cc7ee]" };

/** Mounted once per surface layout. Sits above the mobile tab bar. */
export function Toaster({ offsetBottom = false }: { offsetBottom?: boolean }) {
  const { items, dismiss } = useToast();
  return (
    <div
      aria-live="polite" role="status"
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[90] flex flex-col items-center gap-2 px-4",
        offsetBottom ? "bottom-[calc(var(--tabbar-h)+16px+env(safe-area-inset-bottom))] lg:bottom-6" : "bottom-6",
      )}
    >
      {items.map((t) => {
        const Icon = icon[t.tone];
        return (
          <div key={t.id} className=" pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-pop">
            <Icon className={cn("size-5 shrink-0", tint[t.tone])} />
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.action && <Link href={t.action.href} className="shrink-0 font-semibold text-gold-400 underline-offset-2 hover:underline">{t.action.label}</Link>}
            <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="shrink-0 text-white/60 hover:text-white"><X className="size-4" /></button>
          </div>
        );
      })}
    </div>
  );
}
