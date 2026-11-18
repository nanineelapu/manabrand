import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The official ManaBrand logo (public/logo.png, transparent PNG, 1122×1402). */
const HEIGHT = { xs: 36, sm: 44, md: 56, lg: 96, xl: 140, "2xl": 224, "3xl": 288 } as const;
const HCLASS = { xs: "h-9", sm: "h-11", md: "h-14", lg: "h-24", xl: "h-36", "2xl": "h-56", "3xl": "h-72" } as const;
export type LogoSize = keyof typeof HEIGHT;

export function LogoImage({ size = "md", className, priority }: { size?: LogoSize; className?: string; priority?: boolean }) {
  const h = HEIGHT[size];
  return (
    <Image src="/logo.png" alt="ManaBrand" width={1122} height={1402} priority={priority}
      sizes={`${Math.round(h * 0.8)}px`} className={cn("w-auto select-none object-contain", HCLASS[size], className)} />
  );
}

/**
 * Logo link. `variant` adds the Admin / Seller Hub tag chip beside it.
 * `invert` and `compact` are kept for API compatibility with existing callers.
 */
export function Logo({
  variant = "store", href = "/", className, invert, compact, size,
}: { variant?: "store" | "admin" | "seller"; href?: string; className?: string; invert?: boolean; compact?: boolean; size?: LogoSize }) {
  const tag = variant === "admin" ? "Admin" : variant === "seller" ? "Seller Hub" : null;
  return (
    <Link href={href} aria-label={`ManaBrand${tag ? ` ${tag}` : ""} home`} className={cn("inline-flex items-center gap-3", className)}>
      <LogoImage size={size ?? (compact ? "xs" : "sm")} />
      {tag && !compact && (
        <span className={cn("px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]", invert ? "bg-white/10 text-white/80" : "bg-accent-soft text-accent-soft-fg")}>{tag}</span>
      )}
    </Link>
  );
}
