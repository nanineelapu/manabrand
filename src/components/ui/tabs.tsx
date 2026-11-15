"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem { value: string; label: string; count?: number; href?: string }

/**
 * Horizontally scrollable tab strip (mobile-friendly). Works controlled
 * (value/onChange), or as link tabs when items carry `href`.
 * variant "pill": rounded chips; "line": underline tabs.
 */
export function Tabs({
  items, value, onChange, variant = "line", className, size = "md",
}: {
  items: TabItem[]; value: string; onChange?: (v: string) => void;
  variant?: "line" | "pill"; className?: string; size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className={cn("no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0",
      variant === "line" && "border-b border-line", className)}>
      {items.map((t) => {
        const active = t.value === value;
        const cls = cn(
          "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors",
          size === "sm" ? "text-[13px]" : "text-sm",
          variant === "line"
            ? cn("h-11 px-3", active ? "text-fg" : "text-muted hover:text-fg")
            : cn(size === "sm" ? "h-8 px-3" : "h-9 px-4", "rounded-full border",
                active ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card text-fg hover:bg-bg-subtle"),
        );
        const inner = (
          <>
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[11px] tabular",
                variant === "pill" ? (active ? "bg-white/20" : "bg-bg-subtle text-muted") : active ? "bg-accent-soft text-accent-soft-fg" : "bg-bg-subtle text-muted")}>
                {t.count}
              </span>
            )}
            {variant === "line" && active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
          </>
        );
        return t.href ? (
          <Link key={t.value} href={t.href} role="tab" aria-selected={active} className={cls} scroll={false}>{inner}</Link>
        ) : (
          <button key={t.value} role="tab" aria-selected={active} type="button" onClick={() => onChange?.(t.value)} className={cls}>{inner}</button>
        );
      })}
    </div>
  );
}

/** Uncontrolled convenience: renders panels for tabs. */
export function TabPanels({
  items, variant, className,
}: { items: (TabItem & { content: React.ReactNode })[]; variant?: "line" | "pill"; className?: string }) {
  const [v, setV] = useState(items[0]?.value ?? "");
  return (
    <div className={className}>
      <Tabs items={items} value={v} onChange={setV} variant={variant} />
      <div role="tabpanel" className="pt-4">{items.find((i) => i.value === v)?.content}</div>
    </div>
  );
}
