"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { getBuyNowSnapshot, parseBuyNow, setBuyNow, subscribeBuyNow } from "@/lib/buy-now";
import { lineKey, useCart, type CartLine } from "@/lib/stores";

/** Where the lines being priced and ordered come from: the shopper's bag (default) or a single "Buy now" item. */
export interface LinesSource {
  lines: CartLine[];
  coupon: string | null;
  applyCoupon: (code: string | null) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const BuyNowCtx = createContext<LinesSource | null>(null);

/** Price breakdown, coupon box and checkout all read their lines from here, so they work the same for the bag and for Buy now. */
export function useLinesSource(): LinesSource {
  const override = useContext(BuyNowCtx);
  const cart = useCart();
  return override ?? { lines: cart.lines, coupon: cart.coupon, applyCoupon: cart.applyCoupon, setQty: cart.setQty, remove: cart.remove, clear: cart.clear };
}

/** Wrap checkout in this for Buy now: only the tapped product is in the order and the bag is left untouched. */
export function BuyNowScope({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribeBuyNow, getBuyNowSnapshot, () => null);
  const [coupon, setCoupon] = useState<string | null>(null);   // a coupon for this order only — the bag's coupon is not touched
  const line = useMemo(() => parseBuyNow(raw), [raw]);

  const value = useMemo<LinesSource>(() => ({
    lines: line ? [{ key: lineKey(line.productId, line.color, line.size), ...line }] : [],
    coupon,
    applyCoupon: setCoupon,
    setQty: (_key, qty) => { if (line) setBuyNow({ ...line, qty: Math.max(1, Math.min(10, qty)) }); },
    remove: () => setBuyNow(null),
    clear: () => setBuyNow(null),
  }), [line, coupon]);

  return <BuyNowCtx.Provider value={value}>{children}</BuyNowCtx.Provider>;
}
