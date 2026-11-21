"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { sendContactMessage } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";

export function ContactForm() {
  const [v, setV] = useState({ name: "", email: "", phone: "", order: "", topic: "", msg: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const { act, busy } = useAct();
  const set = (k: keyof typeof v, val: string) => { setV((p) => ({ ...p, [k]: val })); setErrs((e) => ({ ...e, [k]: "" })); };

  if (sent) return (
    <div className="rounded-card border border-line bg-card p-8 text-center shadow-card">
      <CheckCircle2 className="mx-auto size-12 text-success" /><h2 className="mt-4 font-display text-2xl font-semibold">Message sent</h2>
      <p className="mt-1 text-sm text-muted">Thanks, {v.name.split(" ")[0]} — we’ll reply to {v.email} within 24 hours.</p>
      <Button variant="outline" className="mt-5" onClick={() => { setSent(false); setV({ name: "", email: "", phone: "", order: "", topic: "", msg: "" }); }}>Send another</Button>
    </div>
  );

  return (
    <form noValidate className="space-y-4 rounded-card border border-line bg-card p-5 shadow-card md:p-7" onSubmit={(e) => {
      e.preventDefault();
      const er: Record<string, string> = {};
      if (!v.name.trim()) er.name = "Tell us your name";
      if (!/^\S+@\S+\.\S+$/.test(v.email)) er.email = "Enter a valid email";
      if (v.phone.trim() && v.phone.replace(/\D/g, "").length < 10) er.phone = "Enter a 10-digit mobile number";
      if (!v.topic) er.topic = "Choose a topic";
      if (v.msg.trim().length < 10) er.msg = "Please add a few more details";
      setErrs(er);
      if (!Object.keys(er).length) act(() => sendContactMessage({ name: v.name, email: v.email, phone: v.phone, order: v.order, topic: v.topic, message: v.msg }), { success: "Message sent", onOk: () => setSent(true), refresh: false });
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="c-n" error={errs.name}><Input id="c-n" autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} invalid={!!errs.name} /></Field>
        <Field label="Email" htmlFor="c-e" error={errs.email}><Input id="c-e" type="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} invalid={!!errs.email} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile number" htmlFor="c-p" error={errs.phone} optional><Input id="c-p" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" maxLength={14} value={v.phone} onChange={(e) => set("phone", e.target.value)} invalid={!!errs.phone} /></Field>
        <Field label="Order number" htmlFor="c-o" optional><Input id="c-o" placeholder="MB-10501" maxLength={20} autoCapitalize="characters" value={v.order} onChange={(e) => set("order", e.target.value.toUpperCase())} /></Field>
      </div>
      <Field label="Topic" htmlFor="c-t" error={errs.topic}><Select id="c-t" value={v.topic} onChange={(e) => set("topic", e.target.value)} invalid={!!errs.topic}><option value="">Select a topic</option>{["Order status", "Product question", "Payments", "Selling on ManaBrand", "Something else"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
      <Field label="Message" htmlFor="c-m" error={errs.msg}><Textarea id="c-m" rows={5} value={v.msg} onChange={(e) => set("msg", e.target.value)} invalid={!!errs.msg} /></Field>
      <Button type="submit" size="lg" className="w-full sm:w-auto" loading={busy}>Send message</Button>
    </form>
  );
}
