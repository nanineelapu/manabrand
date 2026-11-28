import { cn } from "@/lib/utils";

/**
 * Kept as plain wrappers so existing pages don't change: the site no longer fades / lifts / counts things in as you scroll.
 * Content is simply there — no hidden-until-scrolled sections, no per-section observers, no extra script.
 */
export function Reveal({ children, className, as: Tag = "div", ...aria }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "article"; "aria-labelledby"?: string; "aria-label"?: string }) {
  return <Tag {...aria} className={cn(className)}>{children}</Tag>;
}

/** A figure, shown as it is (it used to count up from zero). */
export function CountUp({ value, className }: { value: string; duration?: number; className?: string }) {
  return <span className={className}>{value}</span>;
}
