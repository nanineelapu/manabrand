"use client";

import { useState } from "react";
import { Panel } from "@/components/shared/blocks";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { saveSetting } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import type { SettingsData } from "@/lib/data";


function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 py-3.5"><div className="min-w-0"><p className="text-sm font-medium">{title}</p>{desc && <p className="text-xs text-muted">{desc}</p>}</div>{children}</div>;
}

export function SettingsView({ initial }: { initial: SettingsData }) {
  const { act } = useAct();
  const [tab, setTab] = useState("general");
  const [g, setG] = useState({ name: initial.business.name, email: initial.business.supportEmail, phone: initial.business.supportPhone, gstin: initial.business.gstin ?? "" });
  const [pay, setPay] = useState({ upi: true, card: true, netbanking: true, cod: true, wallet: false, ...initial.payments });
  const [ship, setShip] = useState({ free: String(initial.shipping.freeAbove), fee: String(initial.shipping.standardFee), codFee: String(initial.shipping.codFee), express: String(initial.shipping.expressFee) });
  const [commission, setCommission] = useState({ default: String(initial.commission.default), women: "12", ethnic: "10", footwear: "14" });
  const [err, setErr] = useState<Record<string, string>>({});

  const saveGeneral = (e: React.FormEvent) => {
    e.preventDefault(); const er: Record<string, string> = {};
    if (!g.name.trim()) er.name = "Required";
    if (!/^\S+@\S+\.\S+$/.test(g.email)) er.email = "Enter a valid email";
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ\w$/.test(g.gstin)) er.gstin = "Enter a valid 15-character GSTIN";
    setErr(er); if (!Object.keys(er).length) act(() => saveSetting("business", { name: g.name, supportEmail: g.email, supportPhone: g.phone, gstin: g.gstin }), { success: "Settings saved", refresh: false });
  };

  return (
    <>
      <Tabs value={tab} onChange={setTab} className="mb-5" items={[{ value: "general", label: "General" }, { value: "payments", label: "Payments" }, { value: "shipping", label: "Shipping" }, { value: "commission", label: "Commission" }]} />

      {tab === "general" && (
        <Panel title="Business profile"><form onSubmit={saveGeneral} noValidate className="max-w-2xl space-y-4">
          <Field label="Legal name" htmlFor="s1" error={err.name}><Input id="s1" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} invalid={!!err.name} /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Support email" htmlFor="s2" error={err.email}><Input id="s2" type="email" value={g.email} onChange={(e) => setG({ ...g, email: e.target.value })} invalid={!!err.email} /></Field><Field label="Support phone" htmlFor="s3"><Input id="s3" value={g.phone} onChange={(e) => setG({ ...g, phone: e.target.value })} /></Field></div>
          <Field label="GSTIN" htmlFor="s4" error={err.gstin}><Input id="s4" value={g.gstin} onChange={(e) => setG({ ...g, gstin: e.target.value.toUpperCase() })} className="font-mono" invalid={!!err.gstin} /></Field>
          <Button type="submit">Save changes</Button>
        </form></Panel>
      )}

      {tab === "payments" && (
        <Panel title="Payment methods" padded={false}><div className="divide-y divide-line px-4 md:px-5">
          {([["upi", "UPI", "GPay, PhonePe, Paytm, BHIM"], ["card", "Credit & debit cards", "Visa, Mastercard, RuPay, Amex"], ["netbanking", "Net banking", "50+ banks"], ["cod", "Cash on delivery", "Handling fee applies"], ["wallet", "Wallets", "Paytm, Amazon Pay"]] as const).map(([k, t, d]) => (
            <Row key={k} title={t} desc={d}><Switch label={t} checked={pay[k]} onChange={(v) => act(() => saveSetting("payments", { ...pay, [k]: v }), { success: `${t} ${v ? "enabled" : "disabled"}`, refresh: false, onOk: () => setPay({ ...pay, [k]: v }) })} /></Row>
          ))}
        </div></Panel>
      )}

      {tab === "shipping" && (
        <Panel title="Shipping rules"><form className="grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); act(() => saveSetting("shipping", { freeAbove: Number(ship.free), standardFee: Number(ship.fee), expressFee: Number(ship.express), codFee: Number(ship.codFee) }), { success: "Shipping rules updated", refresh: false }); }}>
          <Field label="Free shipping above (₹)" htmlFor="h1" hint="Set very high (9999999) to never offer free delivery."><Input id="h1" inputMode="numeric" value={ship.free} onChange={(e) => setShip({ ...ship, free: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Standard shipping fee (₹)" htmlFor="h2"><Input id="h2" inputMode="numeric" value={ship.fee} onChange={(e) => setShip({ ...ship, fee: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Express delivery fee (₹)" htmlFor="h3"><Input id="h3" inputMode="numeric" value={ship.express} onChange={(e) => setShip({ ...ship, express: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="COD handling fee (₹)" htmlFor="h4"><Input id="h4" inputMode="numeric" value={ship.codFee} onChange={(e) => setShip({ ...ship, codFee: e.target.value.replace(/\D/g, "") })} /></Field>
          <div className="sm:col-span-2"><Button type="submit">Save rules</Button></div>
        </form></Panel>
      )}

      {tab === "commission" && (
        <Panel title="Marketplace commission"><form className="grid max-w-2xl gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); act(() => saveSetting("commission", { default: Number(commission.default) }), { success: "Commission rates updated", refresh: false }); }}>
          {([["default", "Default rate"], ["women", "Women"], ["ethnic", "Ethnic"], ["footwear", "Footwear"]] as const).map(([k, l]) => <Field key={k} label={`${l} (%)`} htmlFor={`cm-${k}`}><Input id={`cm-${k}`} inputMode="decimal" value={commission[k]} onChange={(e) => setCommission({ ...commission, [k]: e.target.value })} /></Field>)}
          <p className="text-xs text-muted sm:col-span-2">Per-seller overrides live on each seller’s profile.</p>
          <div className="sm:col-span-2"><Button type="submit">Save rates</Button></div>
        </form></Panel>
      )}
    </>
  );
}
