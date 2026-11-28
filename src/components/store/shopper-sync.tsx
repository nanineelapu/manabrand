"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { loadShopperState, saveCart, saveWishlist } from "@/lib/actions/store";
import { lineKey, useCart, useWishlist } from "@/lib/stores";

/**
 * Signed-in shoppers: merge the on-device bag/wishlist with the saved one once, then keep the database copy
 * up to date (debounced). Signed-out shoppers keep using localStorage only.
 */
/** Is there a login cookie in this browser? (Only a hint to start syncing — the server actions check the real session.) */
const hasLoginCookie = () => /(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie);
const noSubscribe = () => () => {};

export function ShopperSync() {
  const signedIn = useSyncExternalStore(noSubscribe, hasLoginCookie, () => false);
  const lines = useCart((s) => s.lines);
  const coupon = useCart((s) => s.coupon);
  const wishlist = useWishlist((s) => s.ids);
  const ready = useRef(false);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 60));          // let persisted stores rehydrate first
      const r = await loadShopperState();
      if (cancelled) return;
      if (r.ok) {
        const local = useCart.getState().lines;
        const merged = new Map(local.map((l) => [l.key, l]));
        r.cart.forEach((c) => { const key = lineKey(c.productId, c.color, c.size); if (!merged.has(key)) merged.set(key, { key, ...c }); });
        useCart.setState({ lines: [...merged.values()], coupon: useCart.getState().coupon ?? r.coupon });
        useWishlist.setState({ ids: [...new Set([...useWishlist.getState().ids, ...r.wishlist])] });
      }
      ready.current = true;
    })();
    return () => { cancelled = true; };
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || !ready.current) return;
    const t = setTimeout(() => { void saveCart(lines.map((l) => ({ productId: l.productId, color: l.color, size: l.size, qty: l.qty })), coupon); }, 900);
    return () => clearTimeout(t);
  }, [lines, coupon, signedIn]);

  useEffect(() => {
    if (!signedIn || !ready.current) return;
    const t = setTimeout(() => { void saveWishlist(wishlist); }, 900);
    return () => clearTimeout(t);
  }, [wishlist, signedIn]);

  return null;
}
