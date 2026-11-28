"use client";

import { useEffect, useMemo, useState } from "react";
import { Truck, Wallet } from "lucide-react";
import { getWalletBalance } from "@/lib/actions/store";
import { AREA } from "@/lib/locale";
import { MIN_WALLET_ORDER, walletToUse } from "@/lib/wallet";
import { formatINR } from "@/lib/utils";
import { type CouponLite, useStoreData } from "./store-data";

/**
 * What the shopper will actually pay for this one item:
 *   MRP → price → coupon (the best live one the item qualifies for) → wallet
 * Shown in two small pills under the price:
 *   1. "Super fast delivery · <town>" — the one honest delivery promise, shown to everyone
 *   2. "Best Price ₹X · with offers" — shown when the coupon or wallet actually lowers the price
 * The wallet is fetched after mount so the product page stays prebuilt.
 */
export function BestPrice({ price }: { price: number }) {
  const { coupons } = useStoreData();
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => { let done = false; getWalletBalance().then((b) => { if (!done) setBalance(b); }).catch(() => {}); return () => { done = true; }; }, []);

  const { afterCoupon, coupon } = useMemo(() => pickBestCoupon(price, coupons), [price, coupons]);
  const walletUse = balance && balance > 0 ? walletToUse(balance, afterCoupon, afterCoupon) : 0;
  const best = Math.max(0, afterCoupon - walletUse);
  const saved = price - best;
  const eligible = price >= MIN_WALLET_ORDER;

  const sources: string[] = [];
  if (coupon) sources.push(`${coupon.code}`);
  if (walletUse > 0) sources.push("wallet");
  const sourceText = sources.length === 2 ? `${sources[0]} + wallet` : sources[0];

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {/* delivery pill — always visible, in the site's ink / pink theme */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
        <Truck className="size-3.5" /> Super fast delivery
        <span className="font-normal text-white/70"> · {AREA.town}</span>
      </span>

      {/* best price pill — only shown when the final price is really lower */}
      {saved > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
          <Wallet className="size-3.5" /> Best Price {formatINR(best)}
          {sourceText && <span className="font-normal text-success/75"> · with {sourceText}</span>}
        </span>
      )}

      {/* a nudge for shoppers who could use the wallet but are not signed in yet */}
      {eligible && balance === 0 && walletUse === 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent-soft-fg">
          <Wallet className="size-3.5" /> Save up to {formatINR(walletToUse(999, afterCoupon, afterCoupon))} with your wallet
        </span>
      )}
    </div>
  );
}

/**
 * The best coupon the shopper could use on a single-item order of this price. "Best" = the biggest actual rupee discount
 * (percent coupons are capped by maxDiscount, flat coupons by the price). Shipping-type coupons don't change the item price,
 * so they are ignored here. Returns the price after the coupon and the winning coupon (if any).
 */
function pickBestCoupon(price: number, coupons: CouponLite[]): { afterCoupon: number; coupon: CouponLite | null } {
  let best: CouponLite | null = null;
  let bestOff = 0;
  for (const c of coupons) {
    if (c.type === "shipping") continue;
    if (price < c.minOrder) continue;
    const off = c.type === "percent"
      ? Math.min(c.maxDiscount ?? Infinity, Math.round((price * c.value) / 100))
      : Math.min(c.value, price);
    if (off > bestOff) { bestOff = off; best = c; }
  }
  return { afterCoupon: Math.max(0, price - bestOff), coupon: best };
}
