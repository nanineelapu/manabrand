import Link from "next/link";
import { CountUp } from "@/components/ui/motion";
import { ArrowDownRight, ArrowUpRight, Check } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { Sparkline } from "./charts";
import type { OrderStatus, TimelineEvent } from "@/types";
import { statusLabel } from "./status";

/* ---------- Page header for admin / seller screens ---------- */
export function PageHeader({
  title, subtitle, actions, back, className, eyebrow,
}: { title: string; subtitle?: string; actions?: React.ReactNode; back?: { href: string; label: string }; className?: string; eyebrow?: string }) {
  return (
    <header className={cn("mb-5 md:mb-6", className)}>
      {back && <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg">← {back.label}</Link>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-accent">{eyebrow}</p>}
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight md:text-[26px]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ---------- Stat / KPI card ---------- */
export function StatCard({
  label, value, delta, spark, icon, hint, className, tone,
}: {
  label: string; value: string; delta?: number; spark?: number[]; icon?: React.ReactNode; hint?: string; className?: string; tone?: "accent";
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn("lift rounded-card border border-line bg-card p-4 shadow-card md:p-5", tone === "accent" && "bg-accent-soft", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        {icon && <span className="grid size-8 place-items-center rounded-full bg-bg-subtle text-muted [&>svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight tabular md:text-[28px]"><CountUp value={value} /></p>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        {delta !== undefined ? (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular", up ? "text-success" : "text-danger")}>
            {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta).toFixed(1)}%
            <span className="ml-1 hidden font-normal text-muted md:inline">vs last week</span>
          </span>
        ) : <span className="text-xs text-muted">{hint}</span>}
        {spark && <div className="w-14 shrink-0 md:w-16"><Sparkline data={spark} color={up ? "#2f7d5b" : "#c0392b"} /></div>}
      </div>
    </div>
  );
}

/* ---------- Order timeline ---------- */
const flow: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
export function OrderTimeline({ events, status }: { events: TimelineEvent[]; status: OrderStatus }) {
  const cancelled = status === "cancelled" || status === "returned";
  const doneSet = new Set(events.map((e) => e.status));
  const steps = cancelled ? [...flow.filter((s) => doneSet.has(s)), status] : flow;
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const ev = events.find((e) => e.status === s);
        const done = !!ev;
        const last = i === steps.length - 1;
        const bad = s === "cancelled" || s === "returned";
        return (
          <li key={s} className="relative flex gap-3.5 pb-6 last:pb-0">
            {!last && <span className={cn("absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5", done && doneSet.has(steps[i + 1]) ? "bg-success" : "bg-line-strong")} aria-hidden />}
            <span className={cn("z-10 grid size-7 shrink-0 place-items-center rounded-full border-2",
              bad ? "border-danger bg-danger text-white" : done ? "border-success bg-success text-white" : "border-line-strong bg-card text-subtle")}>
              {done || bad ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-line-strong" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn("text-sm font-semibold", !done && !bad && "text-subtle")}>{statusLabel(s)}</p>
              {ev ? <><p className="text-[13px] text-muted">{ev.note}</p><p className="mt-0.5 text-xs text-subtle">{formatDateTime(ev.at)}</p></> : <p className="text-xs text-subtle">Awaiting</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Stepper (checkout / onboarding) ---------- */
export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-center", className)} aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current, active = i === current;
        return (
          <li key={s} className={cn("flex items-center", i < steps.length - 1 && "flex-1")} aria-current={active ? "step" : undefined}>
            <span className="flex items-center gap-2">
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular",
                done ? "bg-success text-white" : active ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted")}>
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("text-[13px] font-medium", active ? "text-fg" : "text-muted", !active && "hidden xs:inline")}>{s}</span>
            </span>
            {i < steps.length - 1 && <span className={cn("mx-2 h-0.5 flex-1 rounded-full", done ? "bg-success" : "bg-line-strong")} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Key/value list card section ---------- */
export function Panel({
  title, action, children, className, padded = true,
}: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-card border border-line bg-card shadow-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 md:px-5">
          {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn(padded && "p-4 md:p-5")}>{children}</div>
    </section>
  );
}
