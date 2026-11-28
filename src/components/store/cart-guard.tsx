"use client";

import { useEffect } from "react";
import { toast, useCart, useWishlist } from "@/lib/stores";
import { useStoreData } from "./store-data";

/** The most products the store sends to the browser. If the list is that long it may be cut off, so nothing is judged "missing". */
const LIST_LIMIT = 500;

/**
 * Keeps the saved bag and wishlist honest. Items saved on this device before (an older catalogue, a product that has since
 * been removed) can no longer be bought and are not shown on the bag page — they used to stay in the badge count as ghosts.
 * Once the product list is loaded, anything that is not in it is removed.
 */
export function CartGuard() {
  const { byId, products } = useStoreData();
  const lines = useCart((s) => s.lines);
  const wish = useWishlist((s) => s.ids);
  const usable = products.length > 0 && products.length < LIST_LIMIT;   // an empty / cut-off list must never wipe a real bag

  useEffect(() => {
    if (!usable) return;
    const keep = lines.filter((l) => byId.has(l.productId));
    if (keep.length !== lines.length) {
      useCart.setState({ lines: keep });
      toast.info("Some items in your bag are no longer available, so we removed them.");
    }
    const keepWish = wish.filter((id) => byId.has(id));
    if (keepWish.length !== wish.length) useWishlist.setState({ ids: keepWish });
  }, [usable, byId, lines, wish]);

  return null;
}
