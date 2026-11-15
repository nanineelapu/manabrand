"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { FILTER_KEYS, PRICE_BANDS } from "@/lib/listing";

export interface Facets {
  sizes: string[]; optionLabel: string; colors: { name: string; hex: string }[]; sellers: { id: string; name: string }[];
  priceMin: number; priceMax: number;
}

type Draft = Record<string, string | undefined>;

function useListingParams() {
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) ?? undefined;
  const draft: Draft = {};
  FILTER_KEYS.forEach((k) => { draft[k] = get(k); });
  return { sp, draft, sort: get("sort") ?? "featured" };
}

function useNavigate() {
  const router = useRouter(); const pathname = usePathname(); const sp = useSearchParams();
  const [pending, start] = useTransition();
  const push = (patch: Draft) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  return { push, pending };
}

const toggleIn = (csv: string | undefined, v: string) => {
  const s = new Set((csv ?? "").split(",").filter(Boolean));
  if (s.has(v)) s.delete(v); else s.add(v);
  return [...s].join(",") || undefined;
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="border-b border-line py-5 first:pt-0 last:border-0"><legend className="mb-3 text-sm font-semibold">{title}</legend>{children}</fieldset>;
}

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn("inline-flex h-10 min-w-11 items-center justify-center rounded-full border px-4 text-[13px] font-medium transition-colors",
        on ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card hover:bg-bg-subtle")}>{children}</button>
  );
}

/** The actual filter controls; `draft` + `set` make it usable for instant (desktop) and apply-on-confirm (mobile). */
function FilterControls({ facets, draft, set, subs }: { facets: Facets; draft: Draft; set: (p: Draft) => void; subs?: string[] }) {
  const band = PRICE_BANDS.findIndex((b) => String(b.min ?? "") === (draft.min ?? "") && String(b.max ?? "") === (draft.max ?? ""));
  return (
    <div>
      {subs && subs.length > 0 && (
        <Group title="Type">
          <div className="flex flex-wrap gap-2">{subs.map((s) => <Chip key={s} on={draft.sub === s} onClick={() => set({ sub: draft.sub === s ? undefined : s })}>{s}</Chip>)}</div>
        </Group>
      )}
      <Group title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_BANDS.map((b, i) => <Chip key={b.label} on={band === i} onClick={() => set(band === i ? { min: undefined, max: undefined } : { min: b.min?.toString(), max: b.max?.toString() })}>{b.label}</Chip>)}
        </div>
      </Group>
      {facets.sizes.length > 0 && (
        <Group title={facets.optionLabel}>
          <div className="flex flex-wrap gap-2">{facets.sizes.map((s) => <Chip key={s} on={(draft.size ?? "").split(",").includes(s)} onClick={() => set({ size: toggleIn(draft.size, s) })}>{s}</Chip>)}</div>
        </Group>
      )}
      {facets.colors.filter((c) => c.name !== "Standard").length > 1 && <Group title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {facets.colors.map((c) => {
            const on = (draft.color ?? "").split(",").includes(c.name);
            return (
              <button key={c.name} type="button" aria-pressed={on} aria-label={c.name} title={c.name} onClick={() => set({ color: toggleIn(draft.color, c.name) })}
                className={cn("grid size-10 place-items-center rounded-full border-2 transition-all", on ? "border-primary" : "border-transparent hover:border-line-strong")}>
                <span className="grid size-7 place-items-center rounded-full border border-black/10" style={{ background: c.hex }}>{on && <Check className="size-4 text-white mix-blend-difference" strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>
      </Group>}
      {facets.sellers.length > 1 && (
        <Group title="Maker">
          <ul className="space-y-1">
            {facets.sellers.map((s) => {
              const on = (draft.seller ?? "").split(",").includes(s.id);
              return (
                <li key={s.id}>
                  <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" checked={on} onChange={() => set({ seller: toggleIn(draft.seller, s.id) })} className="size-[18px] accent-[var(--primary)]" />{s.name}
                  </label>
                </li>
              );
            })}
          </ul>
        </Group>
      )}
      <Group title="Rating">
        <div className="flex flex-wrap gap-2">{[4, 3].map((r) => <Chip key={r} on={draft.rating === String(r)} onClick={() => set({ rating: draft.rating === String(r) ? undefined : String(r) })}>{r}★ & up</Chip>)}</div>
      </Group>
      <Group title="Discount">
        <div className="flex flex-wrap gap-2">{[10, 30, 50].map((d) => <Chip key={d} on={draft.discount === String(d)} onClick={() => set({ discount: draft.discount === String(d) ? undefined : String(d) })}>{d}% & above</Chip>)}</div>
      </Group>
    </div>
  );
}

/* Desktop: instant, sticky sidebar */
export function FilterSidebar({ facets, subs }: { facets: Facets; subs?: string[] }) {
  const { draft } = useListingParams();
  const { push, pending } = useNavigate();
  return (
    <aside aria-label="Filters" className={cn("hidden w-64 shrink-0 lg:block", pending && "opacity-70")}>
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-3">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">Filters</h2><ClearAll /></div>
        <FilterControls facets={facets} draft={draft} set={push} subs={subs} />
      </div>
    </aside>
  );
}

function ClearAll() {
  const { draft } = useListingParams();
  const { push } = useNavigate();
  const any = FILTER_KEYS.some((k) => draft[k]);
  if (!any) return null;
  return <button onClick={() => push(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])))} className="text-xs font-medium text-accent underline underline-offset-2">Clear all</button>;
}

/* Mobile: bottom sheet w/ draft + apply */
export function FilterSheetButton({ facets, subs, total }: { facets: Facets; subs?: string[]; total: number }) {
  const [open, setOpen] = useState(false);
  const { draft } = useListingParams();
  const [local, setLocal] = useState<Draft>(draft);
  const { push } = useNavigate();
  const count = FILTER_KEYS.filter((k) => draft[k]).length;

  return (
    <>
      <button onClick={() => { setLocal(draft); setOpen(true); }} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-ctl border border-line-strong bg-card text-sm font-medium lg:hidden">
        <SlidersHorizontal className="size-4" /> Filter
        {count > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-white">{count}</span>}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="bottom" title="Filters" className="lg:hidden"
        footer={
          <div className="grid grid-cols-[auto_1fr] gap-2.5">
            <Button variant="outline" onClick={() => setLocal(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])))}>Reset</Button>
            <Button onClick={() => { push(local); setOpen(false); }}>Show results</Button>
          </div>
        }>
        <p className="mb-3 text-sm text-muted">{total} products match your current selection</p>
        <FilterControls facets={facets} draft={local} set={(p) => setLocal((d) => ({ ...d, ...p }))} subs={subs} />
      </Sheet>
    </>
  );
}

export function SortSelect({ options }: { options: readonly { value: string; label: string }[] }) {
  const { sort } = useListingParams();
  const { push } = useNavigate();
  return (
    <label className="relative flex-1 lg:flex-none">
      <span className="sr-only">Sort by</span>
      <select value={sort} onChange={(e) => push({ sort: e.target.value === "featured" ? undefined : e.target.value })}
        className="h-11 w-full cursor-pointer appearance-none rounded-ctl border border-line-strong bg-card pl-4 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/30 lg:min-w-52">
        {options.map((o) => <option key={o.value} value={o.value}>{o.value === "featured" ? "Sort: Featured" : o.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
    </label>
  );
}

export function ActiveFilters({ facets }: { facets: Facets }) {
  const { draft } = useListingParams();
  const { push } = useNavigate();
  const chips: { key: string; label: string; clear: Draft }[] = [];
  if (draft.sub) chips.push({ key: "sub", label: draft.sub, clear: { sub: undefined } });
  if (draft.min || draft.max) chips.push({ key: "price", label: draft.min && draft.max ? `₹${draft.min}–₹${draft.max}` : draft.max ? `Under ₹${Number(draft.max) + 1}` : `₹${draft.min}+`, clear: { min: undefined, max: undefined } });
  (draft.size ?? "").split(",").filter(Boolean).forEach((s) => chips.push({ key: `size-${s}`, label: `Size ${s}`, clear: { size: toggleIn(draft.size, s) } }));
  (draft.color ?? "").split(",").filter(Boolean).forEach((c) => chips.push({ key: `color-${c}`, label: c, clear: { color: toggleIn(draft.color, c) } }));
  (draft.seller ?? "").split(",").filter(Boolean).forEach((id) => chips.push({ key: `seller-${id}`, label: facets.sellers.find((s) => s.id === id)?.name ?? id, clear: { seller: toggleIn(draft.seller, id) } }));
  if (draft.rating) chips.push({ key: "rating", label: `${draft.rating}★ & up`, clear: { rating: undefined } });
  if (draft.discount) chips.push({ key: "discount", label: `${draft.discount}%+ off`, clear: { discount: undefined } });
  if (!chips.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {chips.map((c) => (
        <button key={c.key} onClick={() => push(c.clear)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft pl-3 pr-2 text-[13px] font-medium text-accent-soft-fg">
          {c.label}<X className="size-3.5" aria-label="Remove filter" />
        </button>
      ))}
    </div>
  );
}
