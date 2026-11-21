"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Landmark, Percent, Store, Truck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Stepper } from "@/components/shared/blocks";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { registerSeller } from "@/lib/actions/manage";
import { passwordError } from "@/lib/auth/validation";
import { toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const cats = ["Women's wear", "Men's wear", "Ethnic wear", "Footwear", "Bags", "Jewellery", "Watches", "Eyewear"];
const STEPS = ["Business", "Verify", "Store"];
type V = Record<string, string>;

export function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [v, setV] = useState<V>({ store: "", owner: "", phone: "", email: "", password: "", city: "", pan: "", gstin: "", acc: "", ifsc: "", about: "", pickup: "" });
  const [selCats, setSelCats] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [errs, setErrs] = useState<V>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string, val: string) => { setV((p) => ({ ...p, [k]: val })); setErrs((e) => ({ ...e, [k]: "" })); };

  const validate = (s: number) => {
    const e: V = {};
    if (s === 0) {
      if (v.store.trim().length < 2) e.store = "Enter your store name";
      if (!v.owner.trim()) e.owner = "Enter the owner’s name";
      if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.phone.replace(/\s/g, ""))) e.phone = "Enter a valid 10-digit mobile number";
      if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = "Enter a valid email";
      if (!v.city.trim()) e.city = "Enter your city";
      if (!selCats.length) e.cats = "Pick at least one category";
      const pe = passwordError(v.password); if (pe) e.password = pe;
    }
    if (s === 1) {
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(v.pan)) e.pan = "PAN looks like ABCDE1234F";
      if (v.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ\w$/.test(v.gstin)) e.gstin = "Enter a valid 15-character GSTIN";
      if (!/^\d{9,18}$/.test(v.acc)) e.acc = "Enter your account number (9–18 digits)";
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.ifsc)) e.ifsc = "IFSC looks like HDFC0001234";
    }
    if (s === 2) {
      if (v.about.trim().length < 20) e.about = "Tell shoppers about your craft (min. 20 characters)";
      if (!v.pickup.trim()) e.pickup = "Add your pickup address";
      if (!agree) e.agree = "Please accept the seller agreement";
    }
    setErrs(e); return !Object.keys(e).length;
  };

  const next = async () => {
    if (!validate(step)) return;
    if (step < 2) { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setBusy(true);
    const res = await registerSeller({ store: v.store, owner: v.owner, phone: v.phone, email: v.email, password: v.password, city: v.city, categories: selCats, pan: v.pan, gstin: v.gstin, ifsc: v.ifsc, account: v.acc, about: v.about, pickup: v.pickup });
    if (!res.ok && !res.demo) { setBusy(false); toast.error(res.error); return; }
    if (!res.ok) await new Promise((r) => setTimeout(r, 900));
    setBusy(false); setDone(true); toast.success("Application submitted");
  };

  if (done) return (
    <div className="container-page max-w-lg py-16 text-center">
      <span className="mx-auto grid size-20 animate-pop-in place-items-center rounded-full bg-gold-100"><CheckCircle2 className="size-11 text-gold-500" /></span>
      <h1 className="mt-6 font-display text-4xl font-semibold">You’re on the list!</h1>
      <p className="mt-2 text-muted">Thanks, {v.owner.split(" ")[0]}. We’ll verify <b className="text-fg">{v.store}</b> within 24–48 hours and email you at {v.email}.</p>
      <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm">
        {["Application received", "KYC & document check", "Store goes live — start listing"].map((t, i) => <li key={t} className="flex items-center gap-3 rounded-ctl bg-card p-3.5 shadow-card"><span className={cn("grid size-7 place-items-center rounded-full text-xs font-bold", i === 0 ? "bg-success text-white" : "bg-bg-subtle text-muted")}>{i + 1}</span>{t}</li>)}
      </ol>
      <Button href="/seller" size="lg" className="mt-8 rounded-full">Preview seller hub</Button>
    </div>
  );


  return (
    <div className="container-page max-w-2xl pb-32 pt-6 md:pt-12">
      <div className="mb-8 flex items-center justify-between"><Logo variant="seller" size="md" /><Link href="/seller/login" className="text-sm font-medium underline underline-offset-4">Sign in</Link></div>
      <Stepper steps={STEPS} current={step} className="mb-8" />
      <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight md:text-4xl">{["Tell us about your business", "Verify & get paid", "Set up your store"][step]}</h1>
      <p className="mt-1.5 text-sm text-muted">{["Takes about 5 minutes. No fees to start — we only earn when you sell.", "We verify every maker to keep ManaBrand trusted. Your details are encrypted.", "Last step — introduce yourself to shoppers."][step]}</p>

      <div className="mt-7 space-y-4">
        {step === 0 && <>
          <Field label="Store name" htmlFor="rs" error={errs.store}><Input id="rs" value={v.store} onChange={(e) => set("store", e.target.value)} placeholder="e.g. Kalamkari & Co." invalid={!!errs.store} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Owner name" htmlFor="ro" error={errs.owner}><Input id="ro" autoComplete="name" value={v.owner} onChange={(e) => set("owner", e.target.value)} invalid={!!errs.owner} /></Field>
            <Field label="Mobile" htmlFor="rp" error={errs.phone}><Input id="rp" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} invalid={!!errs.phone} /></Field>
            <Field label="Email" htmlFor="re" error={errs.email}><Input id="re" type="email" inputMode="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} invalid={!!errs.email} /></Field>
            <Field label="City" htmlFor="rc" error={errs.city}><Input id="rc" autoComplete="address-level2" value={v.city} onChange={(e) => set("city", e.target.value)} invalid={!!errs.city} /></Field>
          </div>
          <Field label="Create a password" htmlFor="rpw" error={errs.password} hint="You’ll use your email and this password to sign in."><Input id="rpw" type="password" autoComplete="new-password" value={v.password} onChange={(e) => set("password", e.target.value)} invalid={!!errs.password} /></Field>
          <fieldset><legend className="mb-2 text-[13px] font-medium">What will you sell? {errs.cats && <span className="font-normal text-danger">— {errs.cats}</span>}</legend>
            <div className="flex flex-wrap gap-2">{cats.map((c) => <button type="button" key={c} aria-pressed={selCats.includes(c)} onClick={() => { setSelCats((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c])); setErrs((e) => ({ ...e, cats: "" })); }} className={cn("h-11 rounded-full border px-5 text-sm font-medium", selCats.includes(c) ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card hover:bg-bg-subtle")}>{c}</button>)}</div>
          </fieldset>
          <div className="mt-2 grid grid-cols-3 gap-2.5 text-center text-xs">
            {[[Percent, "12% fee", "only on sales"], [Truck, "Free pickup", "from your door"], [Landmark, "T+2 payouts", "to your bank"]].map(([I, t, d]) => { const Icon = I as typeof Percent; return <div key={t as string} className="rounded-card bg-gold-100 p-3"><Icon className="mx-auto size-5 text-gold-500" /><p className="mt-1.5 font-semibold">{t as string}</p><p className="text-muted">{d as string}</p></div>; })}
          </div>
        </>}

        {step === 1 && <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="PAN" htmlFor="pan" error={errs.pan}><Input id="pan" value={v.pan} maxLength={10} onChange={(e) => set("pan", e.target.value.toUpperCase())} className="font-mono uppercase" invalid={!!errs.pan} /></Field>
            <Field label="GSTIN" htmlFor="gst" error={errs.gstin} optional><Input id="gst" value={v.gstin} maxLength={15} onChange={(e) => set("gstin", e.target.value.toUpperCase())} className="font-mono uppercase" invalid={!!errs.gstin} /></Field>
            <Field label="Bank account number" htmlFor="acc" error={errs.acc}><Input id="acc" inputMode="numeric" value={v.acc} onChange={(e) => set("acc", e.target.value.replace(/\D/g, ""))} invalid={!!errs.acc} /></Field>
            <Field label="IFSC code" htmlFor="ifsc" error={errs.ifsc}><Input id="ifsc" value={v.ifsc} maxLength={11} onChange={(e) => set("ifsc", e.target.value.toUpperCase())} className="font-mono uppercase" invalid={!!errs.ifsc} /></Field>
          </div>
          <p className="bg-accent-soft px-4 py-3.5 text-sm text-accent-soft-fg">You’ll upload your PAN card, cancelled cheque and other documents right after creating your account, from <b>Store profile → Verification</b>. They are stored privately.</p>
        </>}

        {step === 2 && <>
          <Field label="About your store" htmlFor="ab" error={errs.about} hint={`${v.about.length}/300`}><Textarea id="ab" rows={4} maxLength={300} value={v.about} onChange={(e) => set("about", e.target.value)} placeholder="Your craft, your region, what makes your pieces special…" invalid={!!errs.about} /></Field>
          <Field label="Pickup address" htmlFor="pk" error={errs.pickup}><Textarea id="pk" rows={3} value={v.pickup} onChange={(e) => set("pickup", e.target.value)} placeholder="Where should couriers collect orders?" invalid={!!errs.pickup} /></Field>
          <div className="flex items-center gap-3 rounded-card bg-card p-4 shadow-card"><span className="grid size-11 place-items-center rounded-full bg-gold-100"><Store className="size-5 text-gold-500" /></span><p className="text-sm text-muted">Logo and banner can be added from your store profile once you’re approved.</p></div>
          <div><Checkbox checked={agree} onChange={(b) => { setAgree(b); setErrs((e) => ({ ...e, agree: "" })); }} label={<>I accept the <Link href="/terms" className="underline">Seller Agreement</Link> and the 12% marketplace fee.</>} />{errs.agree && <p role="alert" className="mt-1 text-xs text-danger">{errs.agree}</p>}</div>
        </>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3">
          {step > 0 && <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button size="lg" className="flex-1" loading={busy} onClick={next}>{step === 2 ? "Submit application" : "Continue"}</Button>
        </div>
      </div>
    </div>
  );
}
