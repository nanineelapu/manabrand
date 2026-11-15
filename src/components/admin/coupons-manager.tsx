"use client";

import { useState } from "react";
import { Percent, Plus, Tag, Truck } from "lucide-react";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/display";
import { Field, Input, Select, Switch } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { saveCoupon, setCouponStatus } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { formatDate, formatINR } from "@/lib/utils";
import type { Coupon } from "@/types";

const icon = { percent: Percent, flat: Tag, shipping: Truck };
const label = (c: Coupon) => (c.type === "percent" ? `${c.value}% off` : c.type === "flat" ? `${formatINR(c.value)} off` : "Free shipping");

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const [list, setList] = useState(coupons);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ code: "", type: "percent" as Coupon["type"], value: "10", min: "999", limit: "1000", expires: "2026-12-31" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const { act } = useAct();

  const create = () => {
    const e: Record<string, string> = {};
    if (!/^[A-Z0-9]{4,14}$/.test(f.code)) e.code = "4–14 letters or digits, no spaces";
    if (list.some((c) => c.code === f.code)) e.code = "This code already exists";
    if (f.type !== "shipping" && !(Number(f.value) > 0)) e.value = "Enter a discount value";
    if (f.type === "percent" && Number(f.value) > 80) e.value = "Max 80%";
    if (!(Number(f.limit) > 0)) e.limit = "Set a usage limit";
    setErrs(e); if (Object.keys(e).length) return;
    const local = () => setList([{ id: `cp${Date.now()}`, code: f.code, description: f.type === "percent" ? `${f.value}% off orders above ${formatINR(Number(f.min))}` : f.type === "flat" ? `Flat ${formatINR(Number(f.value))} off` : "Free shipping", type: f.type, value: Number(f.value), minOrder: Number(f.min) || 0, used: 0, limit: Number(f.limit), expires: f.expires, status: "active" }, ...list]);
    act(() => saveCoupon({ code: f.code, type: f.type, value: Number(f.value), minOrder: Number(f.min) || 0, usageLimit: Number(f.limit), expires: f.expires }), { success: `${f.code} created`, onOk: () => { local(); setOpen(false); setF({ ...f, code: "" }); }, refresh: true });
  };

  const toggle = (id: string, on: boolean) => act(() => setCouponStatus(id, on ? "active" : "paused"), { success: on ? "Coupon resumed" : "Coupon paused", refresh: false, onOk: () => setList((l) => l.map((c) => (c.id === id ? { ...c, status: on ? "active" : "paused" } : c))) });

  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="size-4" /> Create coupon</Button></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => {
          const Icon = icon[c.type];
          const expired = c.status === "expired";
          return (
            <article key={c.id} className={`rounded-card border border-line bg-card p-4 shadow-card md:p-5 ${expired ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-ctl bg-accent-soft text-accent-soft-fg"><Icon className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="font-mono text-base font-bold tracking-wider">{c.code}</p><p className="text-[13px] text-muted">{c.description}</p></div>
                <StatusBadge status={c.status} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-bg px-2 py-2"><dt className="text-muted">Discount</dt><dd className="mt-0.5 text-[13px] font-semibold">{label(c)}</dd></div>
                <div className="rounded-lg bg-bg px-2 py-2"><dt className="text-muted">Min. order</dt><dd className="mt-0.5 text-[13px] font-semibold tabular">{formatINR(c.minOrder)}</dd></div>
                <div className="rounded-lg bg-bg px-2 py-2"><dt className="text-muted">Expires</dt><dd className="mt-0.5 text-[13px] font-semibold">{formatDate(c.expires, { day: "numeric", month: "short" })}</dd></div>
              </dl>
              <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs"><span className="text-muted">Redeemed</span><span className="font-medium tabular">{c.used.toLocaleString("en-IN")} / {c.limit.toLocaleString("en-IN")}</span></div><Progress value={(c.used / c.limit) * 100} tone={c.used / c.limit > 0.9 ? "warning" : "accent"} label={`${c.code} usage`} /></div>
              {!expired && <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5"><span className="text-sm text-muted">{c.status === "paused" ? "Paused" : c.status === "scheduled" ? "Scheduled" : "Live"}</span><Switch label={`${c.code} active`} checked={c.status === "active"} disabled={c.status === "scheduled"} onChange={(v) => toggle(c.id, v)} /></div>}
            </article>
          );
        })}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} side="dialog" title="Create coupon" footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create coupon</Button></div>}>
        <div className="space-y-4">
          <Field label="Code" htmlFor="cc" error={errs.code}><Input id="cc" value={f.code} onChange={(e) => { setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") }); setErrs({}); }} placeholder="DIWALI20" className="font-mono uppercase tracking-wider" invalid={!!errs.code} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" htmlFor="ct"><Select id="ct" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Coupon["type"] })}><option value="percent">Percentage</option><option value="flat">Flat amount</option><option value="shipping">Free shipping</option></Select></Field>
            {f.type !== "shipping" && <Field label={f.type === "percent" ? "Percent (%)" : "Amount (₹)"} htmlFor="cv" error={errs.value}><Input id="cv" inputMode="numeric" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value.replace(/\D/g, "") })} invalid={!!errs.value} /></Field>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min. order (₹)" htmlFor="cm"><Input id="cm" inputMode="numeric" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Usage limit" htmlFor="cl" error={errs.limit}><Input id="cl" inputMode="numeric" value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value.replace(/\D/g, "") })} invalid={!!errs.limit} /></Field>
          </div>
          <Field label="Expires on" htmlFor="ce"><Input id="ce" type="date" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} /></Field>
        </div>
      </Sheet>
    </>
  );
}
