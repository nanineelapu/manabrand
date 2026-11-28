"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Minus, Plus, Save } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { SearchField } from "@/components/ui/form";
import { updateInventory } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function InventoryEditor({ products }: { products: Product[] }) {
  const [stock, setStock] = useState<Record<string, Record<string, number>>>(() => Object.fromEntries(products.map((p) => [p.id, { ...p.stock }])));
  const [q, setQ] = useState(""); const [tab, setTab] = useState("all");
  const [base, setBase] = useState<Record<string, Record<string, number>>>(() => Object.fromEntries(products.map((p) => [p.id, { ...p.stock }])));
  const { act, busy } = useAct();
  const total = (id: string) => Object.values(stock[id]).reduce((a, b) => a + b, 0);
  const dirty = useMemo(() => products.some((p) => Object.entries(base[p.id] ?? {}).some(([s, n]) => stock[p.id][s] !== n)), [products, stock, base]);
  const rows = products.filter((p) => p.status !== "draft" && (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (tab === "all" || (tab === "low" ? total(p.id) > 0 && total(p.id) <= 30 : total(p.id) === 0)));
  const count = (t: string) => products.filter((p) => p.status !== "draft" && (t === "all" || (t === "low" ? total(p.id) > 0 && total(p.id) <= 30 : total(p.id) === 0))).length;
  const bump = (id: string, size: string, d: number) => setStock((s) => ({ ...s, [id]: { ...s[id], [size]: Math.max(0, (s[id][size] ?? 0) + d) } }));

  return (
    <>
      <div className="mb-4 space-y-3">
        <SearchField value={q} onChange={setQ} placeholder="Search products" className="sm:max-w-sm" />
        <Tabs variant="pill" size="sm" value={tab} onChange={setTab} items={[{ value: "all", label: "All", count: count("all") }, { value: "low", label: "Running low", count: count("low") }, { value: "out", label: "Out of stock", count: count("out") }]} />
      </div>

      <ul className="space-y-3">
        {rows.map((p) => {
          const t = total(p.id);
          return (
            <li key={p.id} className="rounded-card border border-line bg-card p-4 shadow-card md:p-5">
              <div className="flex items-center gap-3.5">
                <span className="aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg"><ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.images?.[0]} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold">{p.name}</p><p className="text-xs text-muted">SKU {p.id.toUpperCase()}</p></div>
                <div className="text-right"><p className={cn("text-xl font-semibold tabular", t === 0 ? "text-danger" : t <= 30 ? "text-warning" : "")}>{t}</p><p className="flex items-center justify-end gap-1 text-[11px] text-muted">{t <= 30 && <AlertTriangle className="size-3" />}in stock</p></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {p.sizes.map((s) => {
                  const n = stock[p.id][s] ?? 0;
                  return (
                    <div key={s} className={cn("flex items-center justify-between rounded-ctl border px-1.5 py-1", n === 0 ? "border-danger/30 bg-danger-bg/50" : "border-line bg-bg")}>
                      <button type="button" aria-label={`Decrease ${s}`} onClick={() => bump(p.id, s, -1)} disabled={n === 0} className="grid size-9 place-items-center rounded-full hover:bg-black/5 disabled:opacity-30"><Minus className="size-4" /></button>
                      <span className="text-center leading-none"><span className="block text-[10px] font-semibold uppercase text-muted">{s}</span><span className="text-[15px] font-semibold tabular">{n}</span></span>
                      <button type="button" aria-label={`Increase ${s}`} onClick={() => bump(p.id, s, 1)} className="grid size-9 place-items-center rounded-full hover:bg-black/5"><Plus className="size-4" /></button>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
        {rows.length === 0 && <li className="rounded-card border border-dashed border-line-strong bg-card p-10 text-center text-sm text-muted">Nothing matches — try another filter.</li>}
      </ul>

      {dirty && (
        <div className=" sticky bottom-[calc(var(--tabbar-h)+10px+env(safe-area-inset-bottom))] z-10 mt-4 flex items-center gap-3 rounded-card border border-line bg-card p-3 shadow-pop lg:bottom-4">
          <p className="mr-auto pl-2 text-sm font-medium">You have unsaved stock changes</p>
          <Button variant="outline" onClick={() => setStock(Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { ...v }])))}>Discard</Button>
          <Button loading={busy} onClick={() => {
            const updates = products.flatMap((p) => Object.entries(stock[p.id]).filter(([s, n]) => base[p.id]?.[s] !== n).map(([value, n]) => ({ productId: p.id, value, stock: n })));
            act(() => updateInventory(updates), { success: `Inventory updated (${updates.length} change${updates.length === 1 ? "" : "s"})`, refresh: false, onOk: () => setBase(Object.fromEntries(Object.entries(stock).map(([k, v]) => [k, { ...v }]))) });
          }}><Save className="size-4" /> Save</Button>
        </div>
      )}
    </>
  );
}
