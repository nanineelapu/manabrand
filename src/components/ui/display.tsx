import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { LogoImage } from "@/components/brand/logo";
import { cn, discountPct, formatINR, initials } from "@/lib/utils";
import { statusTone, type Tone } from "@/lib/design/tokens";

/* ---------- Badge ---------- */
export function Badge({
  tone = "neutral", children, className, dot,
}: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  const t = statusTone[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", t.bg, t.fg, className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({
  children, className, as: Tag = "div", padded = true,
}: { children: React.ReactNode; className?: string; as?: "div" | "section" | "article"; padded?: boolean }) {
  return (
    <Tag className={cn("rounded-card border border-line bg-card shadow-card", padded && "p-4 md:p-5", className)}>{children}</Tag>
  );
}

/**
 * Section heading used across the storefront: an optional small red eyebrow, a compact heavy title with the
 * ManaBrand logo mark beside it, an optional sub-line, and a "view all" pill on the right.
 */
export function SectionHeader({
  title, subtitle, href, hrefLabel = "View all", className, eyebrow, id,
}: { title: string; subtitle?: string; href?: string; hrefLabel?: string; className?: string; eyebrow?: string; id?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.35em] text-primary md:text-[11px]">
            <span aria-hidden className="h-px w-6 bg-primary" />{eyebrow}
          </p>
        )}
        <h2 id={id} className="flex items-center gap-2.5 text-[22px] font-black leading-none tracking-[-0.03em] md:gap-3 md:text-[30px]">
          <span className="truncate">{title}</span>
          <span aria-hidden className="shrink-0"><LogoImage size="xs" className="h-8 md:h-10" /></span>
        </h2>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-2 text-[13px] font-bold md:text-sm">
          <span className="hidden sm:inline">{hrefLabel}</span>
          <span className="grid size-9 place-items-center rounded-full border border-line-strong transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white"><ArrowRight className="size-4" /><span className="sr-only sm:hidden">{hrefLabel}</span></span>
        </Link>
      )}
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 36, className, tone }: { name: string; size?: number; className?: string; tone?: string }) {
  const hues = ["#cc4a33", "#e09a1f", "#2f7d5b", "#2f6fa3", "#8b6bb0", "#b13a26"];
  const bg = tone ?? hues[(name.charCodeAt(0) + name.length) % hues.length];
  return (
    <span aria-hidden className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

/* ---------- Rating ---------- */
export function Rating({
  value, count, size = "sm", className, showValue = true,
}: { value: number; count?: number; size?: "sm" | "md" | "lg"; className?: string; showValue?: boolean }) {
  const star = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3.5";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", size !== "sm" && "text-sm", className)} aria-label={`Rated ${value} out of 5${count ? ` from ${count} reviews` : ""}`}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={cn(star, i <= Math.round(value) ? "fill-gold-500 text-gold-500" : "fill-line text-line")} />
        ))}
      </span>
      {showValue && <span className="font-semibold tabular">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-muted tabular">({count.toLocaleString("en-IN")})</span>}
    </span>
  );
}

/* ---------- Price ---------- */
export function Price({
  price, mrp, size = "md", className, showOff = true,
}: { price: number; mrp?: number; size?: "sm" | "md" | "lg" | "xl"; className?: string; showOff?: boolean }) {
  const off = mrp ? discountPct(price, mrp) : 0;
  const main = { sm: "text-sm", md: "text-[15px]", lg: "text-lg", xl: "text-2xl" }[size];
  const sub = { sm: "text-xs", md: "text-xs", lg: "text-sm", xl: "text-base" }[size];
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular", className)}>
      <span className={cn("font-semibold", main)}>{formatINR(price)}</span>
      {off > 0 && mrp && <span className={cn("text-subtle line-through", sub)}>{formatINR(mrp)}</span>}
      {off > 0 && showOff && <span className={cn("font-semibold text-success", sub)}>{off}% off</span>}
    </span>
  );
}

/* ---------- Skeleton / Progress / Divider ---------- */
export const Skeleton = ({ className }: { className?: string }) => <div className={cn("skeleton rounded-lg", className)} aria-hidden />;

export function Progress({ value, tone = "accent", className, label }: { value: number; tone?: "accent" | "success" | "warning" | "ink"; className?: string; label?: string }) {
  const bar = { accent: "bg-accent", success: "bg-success", warning: "bg-warning", ink: "bg-primary" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-bg-subtle", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon, title, body, action, className,
}: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto flex max-w-sm flex-col items-center px-4 py-14 text-center", className)}>
      {icon && <div className="mb-5 grid size-16 place-items-center rounded-full bg-bg-subtle text-muted [&>svg]:size-7">{icon}</div>}
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {body && <p className="mt-1.5 text-sm text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ---------- Breadcrumb ---------- */
export function Breadcrumb({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
      <ol className="flex items-center gap-1.5 whitespace-nowrap text-[13px] text-muted">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 text-subtle" aria-hidden />}
            {it.href ? <Link href={it.href} className="hover:text-fg hover:underline">{it.label}</Link> : <span className="text-fg" aria-current="page">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- Pagination (link-based) ---------- */
export function Pagination({
  page, pages, hrefFor, className,
}: { page: number; pages: number; hrefFor: (p: number) => string; className?: string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  const withGaps: (number | "gap")[] = [];
  nums.forEach((p, i) => { if (i > 0 && p - nums[i - 1] > 1) withGaps.push("gap"); withGaps.push(p); });
  const cell = "grid size-10 place-items-center rounded-full text-sm font-medium tabular";
  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <Link aria-label="Previous page" aria-disabled={page <= 1} href={hrefFor(Math.max(1, page - 1))} className={cn(cell, "hover:bg-bg-subtle", page <= 1 && "pointer-events-none opacity-40")}><ChevronLeft className="size-4" /></Link>
      {withGaps.map((p, i) => p === "gap"
        ? <span key={`g${i}`} className="px-1 text-subtle">…</span>
        : <Link key={p} href={hrefFor(p)} aria-current={p === page ? "page" : undefined} className={cn(cell, p === page ? "bg-primary text-primary-fg" : "hover:bg-bg-subtle")}>{p}</Link>)}
      <Link aria-label="Next page" aria-disabled={page >= pages} href={hrefFor(Math.min(pages, page + 1))} className={cn(cell, "hover:bg-bg-subtle", page >= pages && "pointer-events-none opacity-40")}><ChevronRight className="size-4" /></Link>
    </nav>
  );
}

/* ---------- Definition row ---------- */
export function DetailRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2.5 text-sm", className)}>
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}
