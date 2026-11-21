"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Panel } from "@/components/shared/blocks";
import { Button } from "@/components/ui/button";
import { Field, Input, SearchField, Select, Switch } from "@/components/ui/form";
import { saveSetting } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { magicLabel, type DealBoxConfig } from "@/lib/magic-hours";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, h) => ({ h, label: `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "AM" : "PM"}` }));

/** Admin → Deal Box: switch the section on/off, set the daily magic hours (India time), the pass price and today's picked products. */
export function DealBoxManager({ initial, products }: { initial: DealBoxConfig; products: { id: string; name: string; category: string }[] }) {
  const [c, setC] = useState(initial);
  const [q, setQ] = useState("");
  const { act, busy } = useAct();
  const bad = c.endHour <= c.startHour ? "The closing hour must be later than the opening hour." : "";
  const shown = products.filter((p) => !q || `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) => setC((s) => ({ ...s, productIds: s.productIds.includes(id) ? s.productIds.filter((x) => x !== id) : s.productIds.length >= 12 ? s.productIds : [...s.productIds, id] }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <Panel title="Settings">
        <div className="space-y-5">
          <Switch label="Show the Deal Box on the home page" checked={c.enabled} onChange={(v) => setC({ ...c, enabled: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opens (India time)" htmlFor="db-s"><Select id="db-s" value={c.startHour} onChange={(e) => setC({ ...c, startHour: Number(e.target.value) })}>{HOURS.slice(0, 23).map((o) => <option key={o.h} value={o.h}>{o.label}</option>)}</Select></Field>
            <Field label="Closes (India time)" htmlFor="db-e" error={bad}><Select id="db-e" value={c.endHour} onChange={(e) => setC({ ...c, endHour: Number(e.target.value) })}>{HOURS.slice(1).map((o) => <option key={o.h} value={o.h}>{o.label}</option>)}</Select></Field>
          </div>
          <Field label="Yearly pass price (₹)" htmlFor="db-p"><Input id="db-p" inputMode="numeric" value={String(c.price)} onChange={(e) => setC({ ...c, price: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></Field>
          <p className="rounded-ctl bg-bg-subtle p-3 text-[13px] text-muted">Shoppers will see: <b className="text-fg">Opens every day, {magicLabel(c)}</b> · <b className="text-fg">₹{c.price} / year</b>.</p>
          <Button loading={busy} disabled={!!bad} onClick={() => act(() => saveSetting("dealbox", c as unknown as Record<string, unknown>), { success: "Deal Box saved", refresh: true })}>Save Deal Box</Button>
        </div>
      </Panel>

      <Panel title={`Picked products (${c.productIds.length}/12)`} action={<SearchField value={q} onChange={setQ} placeholder="Search products" className="w-44" />}>
        <p className="mb-3 text-[13px] text-muted">These appear under the Deal Box as “Today’s picks for members”. Change them whenever you like.</p>
        <ul className="max-h-[26rem] divide-y divide-line overflow-y-auto rounded-ctl border border-line">
          {shown.map((p) => {
            const on = c.productIds.includes(p.id);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => toggle(p.id)} aria-pressed={on} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-bg-subtle">
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded border", on ? "border-primary bg-primary text-primary-fg" : "border-line-strong")}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="text-xs text-muted">{p.category}</span></span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
