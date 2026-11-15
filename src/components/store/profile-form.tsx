"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch } from "@/components/ui/form";
import { updateProfile } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";

export function ProfileForm({ initial }: { initial: { name: string; email: string; phone: string } }) {
  const [v, setV] = useState({ ...initial, dob: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const { act, busy } = useAct();
  const [prefs, setPrefs] = useState({ orders: true, offers: true, whatsapp: false });

  const save = (p: typeof prefs) => act(() => updateProfile({ name: v.name, dob: v.dob, notifyOrders: p.orders, notifyOffers: p.offers, notifyWhatsapp: p.whatsapp }), { success: "Profile updated", refresh: false });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!v.name.trim()) er.name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(v.email)) er.email = "Enter a valid email";
    if (!/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(v.phone)) er.phone = "Enter a valid mobile number";
    setErrs(er);
    if (!Object.keys(er).length) save(prefs);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <form onSubmit={submit} noValidate className="space-y-5 rounded-card border border-line bg-card p-5 shadow-card md:p-6">
        <h2 className="text-[15px] font-semibold">Personal details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="pf-n" error={errs.name}><Input id="pf-n" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} invalid={!!errs.name} /></Field>
          <Field label="Date of birth" htmlFor="pf-d" optional><Input id="pf-d" type="date" value={v.dob} onChange={(e) => setV({ ...v, dob: e.target.value })} /></Field>
          <Field label="Email" htmlFor="pf-e" error={errs.email}><Input id="pf-e" type="email" inputMode="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} invalid={!!errs.email} /></Field>
          <Field label="Mobile" htmlFor="pf-p" error={errs.phone}><Input id="pf-p" type="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} invalid={!!errs.phone} /></Field>
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto" loading={busy}>Save changes</Button>
      </form>

      <section className="space-y-4 rounded-card border border-line bg-card p-5 shadow-card md:p-6">
        <h2 className="text-[15px] font-semibold">Notifications</h2>
        {([["orders", "Order updates", "Shipping & delivery alerts"], ["offers", "Offers & drops", "Sales and new collections"], ["whatsapp", "WhatsApp updates", "Get updates on WhatsApp"]] as const).map(([k, l, d]) => (
          <div key={k} className="flex items-center justify-between gap-4">
            <div><p className="text-sm font-medium">{l}</p><p className="text-xs text-muted">{d}</p></div>
            <Switch label={l} checked={prefs[k]} onChange={(b) => { const np = { ...prefs, [k]: b }; setPrefs(np); save(np); }} />
          </div>
        ))}
      </section>
    </div>
  );
}
