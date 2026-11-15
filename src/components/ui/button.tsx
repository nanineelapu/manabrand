import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,box-shadow,transform,color,border-color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 rounded-ctl";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover",
  accent: "bg-accent text-accent-fg hover:brightness-95",
  secondary: "bg-bg-subtle text-fg hover:bg-line",
  soft: "bg-accent-soft text-accent-soft-fg hover:brightness-95",
  outline: "border border-line-strong bg-card text-fg hover:bg-bg-subtle",
  ghost: "text-fg hover:bg-bg-subtle",
  danger: "bg-danger text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[52px] px-6 text-base",
};

export interface ButtonStyleProps {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  loading?: boolean;
  className?: string;
}

export function buttonStyles({ variant = "primary", size = "md", full, className }: ButtonStyleProps = {}) {
  return cn(base, variants[variant], sizes[size], full && "w-full", className);
}

type ButtonProps = ButtonStyleProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };
type LinkProps = ButtonStyleProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & { href: string };

export function Button(props: ButtonProps | LinkProps) {
  const { variant, size, full, loading, className, ...rest } = props;
  const cls = buttonStyles({ variant, size, full, className });
  if ("href" in rest && rest.href !== undefined) {
    const { children, ...linkRest } = rest as LinkProps;
    return (
      <Link {...linkRest} className={cls}>
        {children}
      </Link>
    );
  }
  const { children, disabled, type = "button", ...btnRest } = rest as ButtonProps;
  return (
    <button type={type} {...btnRest} disabled={disabled || loading} className={cls} aria-busy={loading || undefined}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/** Square icon-only button. Always pass `label` for a11y. 44px touch target by default. */
export function IconButton({
  label, variant = "ghost", size = "md", className, children, ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  label: string; variant?: Variant; size?: Size; className?: string;
}) {
  const dim = size === "sm" ? "size-9" : size === "lg" ? "size-12" : "size-11";
  return (
    <button type="button" aria-label={label} title={label} {...rest}
      className={cn(base, variants[variant], dim, "shrink-0 rounded-full", className)}>
      {children}
    </button>
  );
}
