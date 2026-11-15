"use client";

import { useId, useState } from "react";
import { Check, Minus, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Field wrapper ---------- */
export function Field({
  label, hint, error, children, className, htmlFor, optional,
}: {
  label?: string; hint?: string; error?: string; children: React.ReactNode;
  className?: string; htmlFor?: string; optional?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-baseline justify-between text-[13px] font-medium text-fg">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-subtle">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const control =
  "w-full rounded-ctl border bg-card px-3.5 text-[15px] text-fg placeholder:text-subtle transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:bg-bg-subtle disabled:text-subtle";

export function Input({
  className, invalid, leading, trailing, ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; leading?: React.ReactNode; trailing?: React.ReactNode }) {
  const input = (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(control, "h-11", invalid ? "border-danger" : "border-line-strong",
        leading ? "pl-10" : "", trailing ? "pr-10" : "", className)}
    />
  );
  if (!leading && !trailing) return input;
  return (
    <div className="relative">
      {leading && <span className="pointer-events-none absolute inset-y-0 left-3.5 z-10 grid place-items-center text-subtle">{leading}</span>}
      {input}
      {trailing && <span className="absolute inset-y-0 right-2 grid place-items-center">{trailing}</span>}
    </div>
  );
}

export function Textarea({ className, invalid, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea {...rest} aria-invalid={invalid || undefined}
      className={cn(control, "min-h-24 py-3", invalid ? "border-danger" : "border-line-strong", className)} />
  );
}

export function Select({ className, invalid, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select {...rest} aria-invalid={invalid || undefined}
      className={cn(control, "h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239a8f85' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        invalid ? "border-danger" : "border-line-strong", className)}>
      {children}
    </select>
  );
}

/* ---------- Checkbox / Radio / Switch ---------- */
export function Checkbox({
  label, checked, onChange, className, description,
}: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; className?: string; description?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("flex min-h-8 cursor-pointer items-start gap-3", className)}>
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer absolute inset-0 size-5 cursor-pointer opacity-0" />
        <span className="pointer-events-none grid size-5 place-items-center rounded-md border border-line-strong bg-card transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
          <Check className={cn("size-3.5 text-primary-fg transition-opacity", checked ? "opacity-100" : "opacity-0")} strokeWidth={3} />
        </span>
      </span>
      <span className="text-sm leading-snug">
        {label}
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Radio({
  name, value, checked, onChange, children, className,
}: { name: string; value: string; checked: boolean; onChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn(
      "flex cursor-pointer items-center gap-3 rounded-ctl border p-3.5 transition-colors",
      checked ? "border-primary bg-card ring-1 ring-primary" : "border-line-strong bg-card hover:bg-bg-subtle", className)}>
      <span className="relative grid size-5 shrink-0 place-items-center">
        <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="peer absolute inset-0 cursor-pointer opacity-0" />
        <span className={cn("grid size-5 place-items-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring", checked ? "border-primary" : "border-line-strong")}>
          <span className={cn("size-2.5 rounded-full bg-primary transition-transform", checked ? "scale-100" : "scale-0")} />
        </span>
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}

export function Switch({
  checked, onChange, label, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-success" : "bg-line-strong")}>
      <span className={cn("absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

/* ---------- Search field ---------- */
export function SearchField({
  value, onChange, placeholder = "Search", className, onSubmit, autoFocus,
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; onSubmit?: () => void; autoFocus?: boolean }) {
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search" value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        aria-label={placeholder} enterKeyHint="search"
        className={cn(control, "h-11 border-line-strong pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-subtle hover:bg-bg-subtle">
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}

/* ---------- Quantity stepper ---------- */
export function QuantityStepper({
  value, onChange, min = 1, max = 10, size = "md",
}: { value: number; onChange: (n: number) => void; min?: number; max?: number; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "size-8" : "size-10";
  return (
    <div className="inline-flex items-center rounded-full border border-line-strong bg-card" role="group" aria-label="Quantity">
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)}
        className={cn(dim, "grid place-items-center rounded-full hover:bg-bg-subtle disabled:opacity-40")}>
        <Minus className="size-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)}
        className={cn(dim, "grid place-items-center rounded-full hover:bg-bg-subtle disabled:opacity-40")}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/* ---------- OTP input (UI only) ---------- */
export function OtpInput({ length = 6, onComplete }: { length?: number; onComplete?: (v: string) => void }) {
  const [vals, setVals] = useState<string[]>(Array(length).fill(""));
  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...vals]; next[i] = d; setVals(next);
    if (d && i < length - 1) (document.getElementById(`otp-${i + 1}`) as HTMLInputElement | null)?.focus();
    if (next.every(Boolean)) onComplete?.(next.join(""));
  };
  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time password">
      {vals.map((v, i) => (
        <input key={i} id={`otp-${i}`} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={1} value={v}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Backspace" && !v && i > 0) (document.getElementById(`otp-${i - 1}`) as HTMLInputElement | null)?.focus(); }}
          aria-label={`Digit ${i + 1}`}
          className="h-13 w-full min-w-0 rounded-ctl border border-line-strong bg-card text-center text-xl font-semibold focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
      ))}
    </div>
  );
}
