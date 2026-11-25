"use client";

import { walletToUse } from "@/lib/wallet";
import { payWithRazorpay } from "@/lib/payments/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Building2, Wallet, Check, ChevronDown, CreditCard, Lock, MapPin, Plus, Smartphone, Truck } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Stepper } from "@/components/shared/blocks";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/display";
import { Field, Input, Radio, Select, Switch } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { COD_FEE } from "@/lib/cart";
import { toast, useCart } from "@/lib/stores";
import { placeOrder, saveAddress } from "@/lib/actions/store";
import { useMounted } from "@/lib/stores/hydrate";
import { cn, formatINR } from "@/lib/utils";
import type { Address } from "@/types";
import { AddressForm } from "./address-form";
import { PriceBreakdown, useCartPricing } from "./price-breakdown";
import { ShoppingBag } from "lucide-react";

type Pay = "upi" | "card" | "cod" | "netbanking";
const STEPS = ["Address", "Delivery", "Payment"];

/** Demo mode only (no database): a made-up order number. */
const demoOrderNumber = () => `MB-${10500 + Math.floor(Math.random() * 400)}`;

export function CheckoutFlow({ addresses: initial, onlinePayments = true, gateway = false, walletBalance = 0 }: { addresses: Address[]; onlinePayments?: boolean; gateway?: boolean; walletBalance?: number }) {
  const router = useRouter();
  const mounted = useMounted();
  const cart = useCartPricing();
  const clear = useCart((s) => s.clear);
  const couponCode = useCart((s) => s.coupon);

  const [step, setStep] = useState(0);
  const [addrs, setAddrs] = useState(initial);
  const [addrId, setAddrId] = useState(initial.find((a) => a.isDefault)?.id ?? initial[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [useWallet, setUseWallet] = useState(true);   // wallet money is used by default; the shopper can switch it off
  const express = false; // every order is delivered within 48 hours — there is no express tier
  const [pay, setPay] = useState<Pay>(onlinePayments ? "upi" : "cod");
  const [f, setF] = useState({ vpa: "", card: "", name: "", exp: "", cvv: "", bank: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const orderBase = cart.total + (express ? 149 : 0);
  const fullyCoveredByWallet = useWallet && walletBalance >= orderBase && orderBase > 0;
  const codFee = (pay === "cod" && !fullyCoveredByWallet) ? COD_FEE : 0;
  const beforeWallet = orderBase + codFee;
  const walletUse = useWallet ? walletToUse(walletBalance, beforeWallet) : 0;
  const finalTotal = Math.max(0, beforeWallet - walletUse);

  if (!mounted) return <div className="container-page space-y-4 py-8"><Skeleton className="h-8 w-48" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (cart.count === 0) {
    return <div className="container-page py-16"><EmptyState icon={<ShoppingBag />} title="Nothing to check out" body="Your bag is empty." action={<Button href="/shop">Continue shopping</Button>} /></div>;
  }

  const addr = addrs.find((a) => a.id === addrId);
  const setField = (k: keyof typeof f, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: "" })); };

  const validatePay = () => {
    if (fullyCoveredByWallet) return true;
    const e: Record<string, string> = {};
    if (pay === "upi" && !gateway && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(f.vpa.trim())) e.vpa = "Enter a valid UPI ID, e.g. name@okhdfc";
    if (pay === "card" && !gateway) {
      if (f.card.replace(/\s/g, "").length !== 16) e.card = "Enter the 16-digit card number";
      if (!f.name.trim()) e.name = "Enter the name on card";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.exp)) e.exp = "Use MM/YY";
      if (!/^\d{3,4}$/.test(f.cvv)) e.cvv = "3 or 4 digits";
    }
    if (pay === "netbanking" && !gateway && !f.bank) e.bank = "Choose your bank";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const place = async () => {
    if (placing || !validatePay() || !addr) return;
    setPlacing(true);
    const res = await placeOrder({
      lines: cart.lines.map((l) => ({ productId: l.productId, color: l.color, size: l.size, qty: l.qty })),
      address: { name: addr.name, phone: addr.phone, line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, pincode: addr.pincode },
      method: fullyCoveredByWallet ? "cod" : pay, coupon: couponCode, express, wallet: walletUse,
    });
    let number: string, total: number;
    if (res.ok) {
      number = res.number; total = res.total;
      if (pay !== "cod" && res.total > 0) {   // online payment: open Razorpay for what is left after the wallet
        const pr = await payWithRazorpay(res.orderId);
        if (pr.status !== "paid") {
          clear();   // the order exists — keep the bag empty and let the customer finish paying from the order page
          toast.error(pr.status === "error" ? pr.message : "Payment not completed. Your order is saved — you can pay from My orders.");
          router.replace(`/account/orders/${res.orderId}`);
          return;
        }
      }
    }
    else if (res.demo) {   // no database connected: simulate so the demo flow still works
      await new Promise((r) => setTimeout(r, 1100));
      number = demoOrderNumber();
      total = finalTotal;
    } else {
      setPlacing(false);
      if (/sign in/i.test(res.error)) { router.push("/login?next=/checkout"); return; }
      toast.error(res.error); return;
    }
    try { sessionStorage.setItem("mana-last-order", JSON.stringify({ number, total, count: cart.count, pay, express, city: addr.city, name: addr.name, items: cart.lines.slice(0, 4).map((l) => ({ s: l.product.photo, c: l.colorHex, n: l.product.name })) })); } catch { /* private mode */ }
    clear(); toast.success("Order placed!");
    router.replace(`/order-confirmed/${number}`);
  };

  const panel = (i: number, title: string, summary: React.ReactNode, body: React.ReactNode) => {
    const open = step === i, done = step > i;
    return (
      <section className={cn("rounded-card border bg-card shadow-card transition-colors", open ? "border-primary/30" : "border-line")} aria-labelledby={`st-${i}`}>
        <header className="flex items-center gap-3 p-4 md:p-5">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold", done ? "bg-success text-white" : open ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted")}>{done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}</span>
          <div className="min-w-0 flex-1"><h2 id={`st-${i}`} className="text-[15px] font-semibold">{title}</h2>{done && <div className="truncate text-[13px] text-muted">{summary}</div>}</div>
          {done && <button onClick={() => setStep(i)} className="text-sm font-medium underline underline-offset-4">Change</button>}
        </header>
        {open && <div className="border-t border-line p-4 pt-5 md:p-5 md:pt-6">{body}</div>}
      </section>
    );
  };

  const payOptions: { id: Pay; label: string; sub: string; icon: React.ReactNode }[] = [
    { id: "upi", label: "UPI", sub: "GPay, PhonePe, Paytm & more", icon: <Smartphone className="size-5" /> },
    { id: "card", label: "Credit / Debit card", sub: "Visa, Mastercard, RuPay", icon: <CreditCard className="size-5" /> },
    { id: "netbanking", label: "Net banking", sub: "All major banks", icon: <Building2 className="size-5" /> },
    { id: "cod", label: "Cash on delivery", sub: `₹${COD_FEE} handling fee`, icon: <Banknote className="size-5" /> },
  ];

  return (
    <div className="container-page pb-32 pt-4 md:pb-12 md:pt-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="font-display text-[28px] font-semibold tracking-tight md:text-4xl">Checkout</h1>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted"><Lock className="size-3.5" /> Secure</span>
      </div>
      <Stepper steps={STEPS} current={step} className="mb-6 max-w-xl" />

      {/* mobile summary toggle */}
      <details open={summaryOpen} onToggle={(e) => setSummaryOpen((e.target as HTMLDetailsElement).open)} className="mb-5 rounded-card border border-line bg-card lg:hidden">
        <summary className="flex min-h-14 cursor-pointer items-center justify-between px-4 text-sm font-medium"><span>Order summary · {cart.count} items</span><span className="flex items-center gap-2 font-semibold tabular">{formatINR(finalTotal)}<ChevronDown className="size-4 text-muted" /></span></summary>
        <div className="border-t border-line p-4"><PriceBreakdown cod={pay === "cod" && !fullyCoveredByWallet} express={express} wallet={walletUse} /></div>
      </details>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="min-w-0 space-y-3.5">
          {panel(0, "Delivery address", addr && <>{addr.name}, {addr.line1}, {addr.city} {addr.pincode}</>, (
            <div className="space-y-3">
              {addrs.map((a) => (
                <Radio key={a.id} name="address" value={a.id} checked={addrId === a.id} onChange={setAddrId} className="items-start">
                  <div className="flex items-center gap-2"><span className="text-sm font-semibold">{a.name}</span><span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{a.label}</span></div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} – {a.pincode}</p>
                  <p className="mt-0.5 text-[13px] text-muted">Mobile: {a.phone}</p>
                </Radio>
              ))}
              <button onClick={() => setAdding(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-ctl border border-dashed border-line-strong text-sm font-medium hover:bg-bg-subtle"><Plus className="size-4" /> Add a new address</button>
              <Button size="lg" full disabled={!addr} onClick={() => setStep(1)} className="rounded-full">Deliver to this address</Button>
            </div>
          ))}

          {panel(1, "Delivery", "Within 48 hours", (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-ctl border border-line-strong bg-card p-3.5">
                <div><span className="flex items-center gap-2 text-sm font-semibold"><Truck className="size-4" /> Delivery within 48 hours</span><p className="mt-0.5 text-[13px] text-muted">Your order arrives within 48 hours of being placed</p></div>
                <span className="text-sm font-semibold text-success">{cart.shipping === 0 ? "Free" : formatINR(cart.shipping)}</span>
              </div>
              <Button size="lg" full onClick={() => setStep(2)} className="rounded-full">Continue to payment</Button>
            </div>
          ))}

          {panel(2, "Payment", fullyCoveredByWallet ? "Covered by wallet" : null, (
            <div className="space-y-3">
              {walletBalance > 0 && (
                <div className="flex items-center gap-3 rounded-ctl border border-line bg-bg-subtle p-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-accent"><Wallet className="size-5" /></span>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Use wallet balance</p><p className="text-xs text-muted">{formatINR(walletBalance)} available{useWallet && walletUse > 0 ? ` · ${formatINR(walletUse)} will be used` : ""}</p></div>
                  <Switch label="Use wallet balance" checked={useWallet} onChange={setUseWallet} />
                </div>
              )}
              {fullyCoveredByWallet ? (
                <div className="rounded-ctl border border-success/30 bg-success-bg p-4 text-center">
                  <p className="text-sm font-semibold text-success">Your wallet covers this entire order 🎉</p>
                  <p className="mt-1 text-xs text-muted">No additional payment method is needed. Tap below to place your order.</p>
                </div>
              ) : (
                <>
                  {!onlinePayments && <p className="rounded-ctl bg-bg-subtle px-4 py-3 text-[13px] text-muted">Pay when your order arrives — online payments are coming soon.</p>}
                  {payOptions.filter((o) => onlinePayments || o.id === "cod").map((o) => (
                    <div key={o.id}>
                      <Radio name="pay" value={o.id} checked={pay === o.id} onChange={(v) => { setPay(v as Pay); setErrs({}); }}>
                        <div className="flex items-center gap-3"><span className="text-muted">{o.icon}</span><span><span className="block text-sm font-semibold">{o.label}</span><span className="block text-xs text-muted">{o.sub}</span></span></div>
                      </Radio>
                      {!gateway && pay === o.id && o.id === "upi" && (
                        <div className="animate-fade-in mt-2 rounded-ctl bg-bg-subtle p-4"><Field label="UPI ID" htmlFor="vpa" error={errs.vpa}><Input id="vpa" autoCapitalize="none" placeholder="yourname@okhdfc" value={f.vpa} onChange={(e) => setField("vpa", e.target.value)} invalid={!!errs.vpa} /></Field></div>
                      )}
                      {!gateway && pay === o.id && o.id === "card" && (
                        <div className="animate-fade-in mt-2 space-y-3.5 rounded-ctl bg-bg-subtle p-4">
                          <Field label="Card number" htmlFor="cc" error={errs.card}><Input id="cc" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" maxLength={19} value={f.card} onChange={(e) => setField("card", e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim())} invalid={!!errs.card} /></Field>
                          <Field label="Name on card" htmlFor="cn" error={errs.name}><Input id="cn" autoComplete="cc-name" value={f.name} onChange={(e) => setField("name", e.target.value)} invalid={!!errs.name} /></Field>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Expiry" htmlFor="ce" error={errs.exp}><Input id="ce" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} value={f.exp} onChange={(e) => { let v = e.target.value.replace(/[^\d]/g, ""); if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2, 4)}`; setField("exp", v); }} invalid={!!errs.exp} /></Field>
                            <Field label="CVV" htmlFor="cv" error={errs.cvv}><Input id="cv" inputMode="numeric" type="password" autoComplete="cc-csc" maxLength={4} value={f.cvv} onChange={(e) => setField("cvv", e.target.value.replace(/\D/g, ""))} invalid={!!errs.cvv} /></Field>
                          </div>
                        </div>
                      )}
                      {!gateway && pay === o.id && o.id === "netbanking" && (
                        <div className="animate-fade-in mt-2 rounded-ctl bg-bg-subtle p-4"><Field label="Choose your bank" htmlFor="bk" error={errs.bank}><Select id="bk" value={f.bank} onChange={(e) => setField("bank", e.target.value)} invalid={!!errs.bank}><option value="">Select bank</option>{["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"].map((b) => <option key={b}>{b}</option>)}</Select></Field></div>
                      )}
                    </div>
                  ))}
                </>
              )}
              <Button size="lg" full loading={placing} onClick={place} className="hidden rounded-full lg:inline-flex"><Lock className="size-4" /> {finalTotal === 0 ? "Place order" : `Pay ${formatINR(finalTotal)}`}</Button>
              <p className="text-center text-xs text-muted">By placing your order you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy policy</Link>.</p>
            </div>
          ))}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4 rounded-card border border-line bg-card p-5 shadow-card">
            <h2 className="text-[15px] font-semibold">Order summary</h2>
            <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg"><ProductImage photo={l.product.photo} seed={l.product.id} color={l.colorHex} src={l.product.image} /><span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-ink text-[10px] text-white">{l.qty}</span></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{l.product.name}</span><span className="block text-xs text-muted">{l.color} · {l.size}</span></span>
                  <span className="text-sm font-medium tabular">{formatINR(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <PriceBreakdown cod={pay === "cod" && !fullyCoveredByWallet} express={express} wallet={walletUse} className="border-t border-line pt-4" />
            {addr && <p className="flex gap-2 rounded-ctl bg-bg-subtle p-3 text-xs text-muted"><MapPin className="mt-0.5 size-4 shrink-0" /> Delivering to {addr.name}, {addr.city} {addr.pincode}</p>}
          </div>
        </aside>
      </div>

      {step === 2 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/97 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md items-center gap-4">
            <div><p className="text-xs text-muted">To pay</p><p className="text-xl font-semibold tabular">{formatINR(finalTotal)}</p></div>
            <Button size="lg" loading={placing} onClick={place} className="flex-1 rounded-full"><Lock className="size-4" /> Place order</Button>
          </div>
        </div>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} side="dialog" title="Add new address">
        <AddressForm onCancel={() => setAdding(false)} onSave={async (a) => {
          const tempId = a.id?.startsWith("a") ? a.id : `a${Date.now()}`;
          const optimisticAddr: Address = { ...a, id: tempId };

          // Instant UI feedback: close sheet and select new address immediately with zero lag
          setAdding(false);
          setAddrs((l) => [optimisticAddr, ...l.map((x) => (a.isDefault ? { ...x, isDefault: false } : x))]);
          setAddrId(tempId);
          toast.success("Address added");

          // Persist in background
          try {
            const r = await saveAddress({ ...a, label: a.label });
            if (r.ok && r.id) {
              setAddrs((l) => l.map((x) => (x.id === tempId ? { ...x, id: r.id } : x)));
              setAddrId((curr) => (curr === tempId ? r.id : curr));
            } else if (!r.ok && !r.demo) {
              setAddrs((l) => l.filter((x) => x.id !== tempId));
              toast.error(r.error);
            }
          } catch {
            // Background save failed
          }
        }} />
      </Sheet>
    </div>
  );
}
