"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Package, Truck, Home } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import type { PhotoKind } from "@/types";

interface Saved { number: string; total: number; count: number; pay: string; express: boolean; city?: string; name?: string; items: { s: PhotoKind; c: string; n: string }[] }
const payLabel: Record<string, string> = { upi: "UPI", card: "Card", cod: "Cash on delivery", netbanking: "Net banking" };

export function OrderConfirmed({ number }: { number: string }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("mana-last-order");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) { const s = JSON.parse(raw) as Saved; if (s.number === number) setSaved(s); }
    } catch { /* ignore */ }
  }, [number]);

  const steps = [{ i: Package, t: "Confirmed", on: true }, { i: Truck, t: "Shipped", on: false }, { i: Home, t: "Delivered", on: false }];

  return (
    <div className="container-page max-w-2xl py-10 text-center md:py-16">
      <span className="mx-auto grid size-20 animate-pop-in place-items-center rounded-full bg-success-bg"><CheckCircle2 className="size-11 text-success" /></span>
      <h1 className="mt-6 font-display text-[34px] font-semibold leading-tight md:text-5xl">Thank you{saved?.name ? `, ${saved.name.split(" ")[0]}` : ""}!</h1>
      <p className="mt-2 text-muted">Your order <b className="text-fg">{number}</b> is confirmed. We’ve sent the details to your email.</p>

      <div className="mt-8 rounded-card border border-line bg-card p-5 text-left shadow-card md:p-6">
        <ol className="flex items-center" aria-label="Order progress">
          {steps.map((s, n) => (
            <li key={s.t} className="flex flex-1 items-center last:flex-none">
              <span className="flex flex-col items-center gap-1.5">
                <span className={`grid size-10 place-items-center rounded-full ${s.on ? "bg-success text-white" : "bg-bg-subtle text-subtle"}`}><s.i className="size-5" /></span>
                <span className={`text-xs font-medium ${s.on ? "text-fg" : "text-subtle"}`}>{s.t}</span>
              </span>
              {n < steps.length - 1 && <span className="mx-2 mb-5 h-0.5 flex-1 rounded-full bg-line-strong" />}
            </li>
          ))}
        </ol>
        <dl className="mt-6 grid grid-cols-2 gap-y-4 border-t border-line pt-5 text-sm">
          <div><dt className="text-xs text-muted">Estimated delivery</dt><dd className="font-semibold">Within 48 hours</dd></div>
          <div><dt className="text-xs text-muted">Amount</dt><dd className="font-semibold tabular">{saved ? formatINR(saved.total) : "—"}</dd></div>
          <div><dt className="text-xs text-muted">Payment</dt><dd className="font-semibold">{saved ? payLabel[saved.pay] : "—"}</dd></div>
          <div><dt className="text-xs text-muted">Shipping to</dt><dd className="font-semibold">{saved?.city ?? "Your saved address"}</dd></div>
        </dl>
        {saved && saved.items.length > 0 && (
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-5">
            {saved.items.map((it, i) => <span key={i} className="size-14 overflow-hidden rounded-lg" title={it.n}><ProductImage photo={it.s} color={it.c} /></span>)}
            <span className="ml-1 text-sm text-muted">{saved.count} {saved.count === 1 ? "item" : "items"}</span>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button href="/account/orders" size="lg" className="rounded-full">View my orders</Button>
        <Button href="/shop" size="lg" variant="outline" className="rounded-full">Continue shopping</Button>
      </div>
    </div>
  );
}
