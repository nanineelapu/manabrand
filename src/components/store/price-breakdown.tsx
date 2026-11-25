"use client";

import { useState } from "react";
import { Check, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { priceCart, COD_FEE } from "@/lib/cart";
import { toast, useCart } from "@/lib/stores";
import { cn, formatINR } from "@/lib/utils";
import { useStoreData } from "./store-data";

export function useCartPricing() {
  const { lines, coupon } = useCart();
  const { byId, coupons } = useStoreData();
  return priceCart(lines, byId, coupons, coupon);
}

export function CouponBox() {
  const { coupon, applyCoupon } = useCart();
  const { coupons } = useStoreData();
  const cart = useCartPricing();
  const [code, setCode] = useState(""); const [err, setErr] = useState("");

  const apply = (c: string) => {
    const found = coupons.find((x) => x.code.toLowerCase() === c.trim().toLowerCase());
    if (!found) { setErr("That code isn’t valid or has expired"); return; }
    if (cart.subtotal < found.minOrder) { setErr(`Add ${formatINR(found.minOrder - cart.subtotal)} more to use ${found.code}`); return; }
    setErr(""); setCode(""); applyCoupon(found.code); toast.success(`${found.code} applied`);
  };

  if (coupon && cart.coupon) {
    return (
      <div className="flex items-center gap-3 rounded-ctl border border-success/30 bg-success-bg p-3.5">
        <span className="grid size-9 place-items-center rounded-full bg-success text-white"><Check className="size-4" strokeWidth={3} /></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{cart.coupon.code} applied</p><p className="truncate text-xs text-muted">{cart.coupon.description}</p></div>
        <button aria-label="Remove coupon" onClick={() => applyCoupon(null)} className="grid size-9 place-items-center rounded-full hover:bg-white/60"><X className="size-4" /></button>
      </div>
    );
  }
  return (
    <div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); apply(code); }}>
        <Input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); }} placeholder="Coupon code" aria-label="Coupon code" invalid={!!err} leading={<Tag className="size-4" />} className="uppercase" />
        <Button type="submit" variant="outline" disabled={!code}>Apply</Button>
      </form>
      {err && <p role="alert" className="mt-1.5 text-xs text-danger">{err}</p>}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {coupons.slice(0, 3).map((c) => (
          <button key={c.code} onClick={() => apply(c.code)} className="shrink-0 rounded-ctl border border-dashed border-line-strong bg-card px-3 py-2 text-left hover:bg-bg-subtle">
            <span className="block font-mono text-xs font-bold tracking-wider">{c.code}</span>
            <span className="block max-w-40 truncate text-[11px] text-muted">{c.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PriceBreakdown({ cod, express, wallet = 0, className }: { cod?: boolean; express?: boolean; wallet?: number; className?: string }) {
  const cart = useCartPricing();
  const extra = (cod ? COD_FEE : 0) + (express ? 149 : 0);
  const total = Math.max(0, cart.total + extra - wallet);
  const row = "flex items-center justify-between text-sm";
  return (
    <dl className={cn("space-y-3", className)}>
      <div className={row}><dt className="text-muted">Bag total ({cart.count} {cart.count === 1 ? "item" : "items"})</dt><dd className="tabular">{formatINR(cart.mrpTotal)}</dd></div>
      {cart.savings > 0 && <div className={row}><dt className="text-muted">Discount on MRP</dt><dd className="tabular text-success">− {formatINR(cart.savings)}</dd></div>}
      {cart.discount > 0 && <div className={row}><dt className="text-muted">Coupon ({cart.coupon?.code})</dt><dd className="tabular text-success">− {formatINR(cart.discount)}</dd></div>}
      <div className={row}><dt className="text-muted">Shipping</dt><dd className="tabular">{cart.shipping === 0 ? <span className="font-medium text-success">Free</span> : formatINR(cart.shipping)}</dd></div>
      {express && <div className={row}><dt className="text-muted">Express delivery</dt><dd className="tabular">{formatINR(149)}</dd></div>}
      {cod && <div className={row}><dt className="text-muted">Cash on delivery fee</dt><dd className="tabular">{formatINR(COD_FEE)}</dd></div>}
      {wallet > 0 && <div className={row}><dt className="text-muted">Wallet credit</dt><dd className="tabular text-success">− {formatINR(wallet)}</dd></div>}
      <div className="flex items-baseline justify-between border-t border-line pt-3.5">
        <dt className="text-[15px] font-semibold">Total</dt><dd className="text-xl font-semibold tabular">{formatINR(total)}</dd>
      </div>
      {cart.savings + cart.discount + wallet > 0 && <p className="rounded-ctl bg-success-bg px-3 py-2 text-center text-[13px] font-medium text-success">You’re saving {formatINR(cart.savings + cart.discount + wallet)} on this order 🎉</p>}
    </dl>
  );
}
