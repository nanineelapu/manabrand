"use client";

import { useState } from "react";
import { CalendarDays, Flame, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/display";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { savePromotion, setPromotionActive } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { toast } from "@/lib/stores";

interface Promo { id: string; name: string; off: number; scope: string; ends: string; on: boolean; orders: number }

export function PromotionsManager({ productNames, initial }: { productNames: string[]; initial: Promo[] }) {
  const { act, busy } = useAct();
  const [promos, setPromos] = useState<Promo[]>(initial);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", off: "10", scope: "all", ends: "2026-11-30" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [joined, setJoined] = useState(false);

  const create = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = "Give your promotion a name";
    if (!(Number(f.off) >= 5 && Number(f.off) <= 70)) e.off = "Choose between 5% and 70%";
    setErrs(e); if (Object.keys(e).length) return;
    const local = (id: string) => setPromos([{ id, name: f.name, off: Number(f.off), scope: f.scope === "all" ? "All products" : f.scope, ends: f.ends, on: true, orders: 0 }, ...promos]);
    act(() => savePromotion({ name: f.name, percent: Number(f.off), scope: f.scope, endsOn: f.ends }), { success: "Promotion is live!", refresh: false,
      onOk: (r) => { local("id" in r && r.id ? (r.id as string) : `p${Date.now()}`); setOpen(false); setF({ ...f, name: "" }); }, onDemo: () => { local(`p${Date.now()}`); setOpen(false); setF({ ...f, name: "" }); } });
  };

  return (
    <>
      <section className="mb-5 flex flex-col gap-4 overflow-hidden rounded-card bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-card sm:flex-row sm:items-center md:p-6">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15"><Flame className="size-7" /></span>
        <div className="min-w-0 flex-1"><Badge tone="neutral" className="mb-1.5 bg-white/20 text-white">Marketplace event</Badge><h2 className="font-display text-2xl font-semibold">ManaBrand Winter Wedding Sale</h2><p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80"><CalendarDays className="size-4" /> 1–10 Dec · Top banner placement for participating makers</p></div>
        <Button variant={joined ? "secondary" : "accent"} className="rounded-full" onClick={() => { setJoined(!joined); toast.success(joined ? "You’ve left the event" : "You’re in! We’ll feature your best sellers"); }}>{joined ? "Joined ✓" : "Join event"}</Button>
      </section>

      <div className="mb-4 flex items-center justify-between"><h2 className="text-[15px] font-semibold">Your promotions</h2><Button onClick={() => setOpen(true)}><Plus className="size-4" /> New promotion</Button></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promos.map((p) => (
          <article key={p.id} className="rounded-card border border-line bg-card p-5 shadow-card">
            <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-soft-fg"><Zap className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{p.name}</h3><p className="truncate text-[13px] text-muted">{p.scope}</p></div><span className="font-display text-2xl font-semibold text-accent-soft-fg">{p.off}%</span></div>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-ctl bg-bg p-3 text-center text-xs"><div><dt className="text-muted">Ends</dt><dd className="mt-0.5 text-sm font-semibold">{p.ends}</dd></div><div><dt className="text-muted">Orders</dt><dd className="mt-0.5 text-sm font-semibold tabular">{p.orders}</dd></div></dl>
            <div className="mt-4 flex items-center justify-between"><span className="text-sm text-muted">{p.on ? "Running" : "Paused"}</span><Switch label={`${p.name} running`} checked={p.on} onChange={(v) => act(() => setPromotionActive(p.id, v), { success: v ? "Promotion resumed" : "Promotion paused", refresh: false, onOk: () => setPromos((l) => l.map((x) => (x.id === p.id ? { ...x, on: v } : x))) })} /></div>
          </article>
        ))}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} side="dialog" title="New promotion" description="Discounts you fund come out of your share, not ManaBrand’s."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={create}>Start promotion</Button></div>}>
        <div className="space-y-4">
          <Field label="Name" htmlFor="pn" error={errs.name}><Input id="pn" value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setErrs({}); }} placeholder="e.g. Diwali cotton sale" invalid={!!errs.name} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Discount (%)" htmlFor="po" error={errs.off}><Input id="po" inputMode="numeric" value={f.off} onChange={(e) => setF({ ...f, off: e.target.value.replace(/\D/g, "") })} invalid={!!errs.off} /></Field><Field label="Ends on" htmlFor="pe"><Input id="pe" type="date" value={f.ends} onChange={(e) => setF({ ...f, ends: e.target.value })} /></Field></div>
          <Field label="Applies to" htmlFor="ps"><Select id="ps" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}><option value="all">All my products</option>{productNames.slice(0, 8).map((n) => <option key={n}>{n}</option>)}</Select></Field>
        </div>
      </Sheet>
    </>
  );
}
