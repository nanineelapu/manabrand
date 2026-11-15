"use client";

import { useEffect, useState } from "react";
import { useCart, useRecentSearches, useWishlist } from "./index";

/** Rehydrates persisted stores after mount so SSR markup and first client render match. */
export function StoreHydrator() {
  useEffect(() => {
    useCart.persist.rehydrate();
    useWishlist.persist.rehydrate();
    useRecentSearches.persist.rehydrate();
  }, []);
  return null;
}

/** True after first client render — gate any UI that reads persisted state (badges, hearts). */
export function useMounted() {
  const [m, setM] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setM(true), []);
  return m;
}
