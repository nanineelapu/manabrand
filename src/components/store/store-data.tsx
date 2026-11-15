"use client";

import { createContext, useContext, useMemo } from "react";
import type { ProductColor, PhotoKind } from "@/types";

/** Slim product shape shipped to the client for cart, wishlist, search. */
export interface ProductLite {
  image?: string;
  id: string; slug: string; name: string; price: number; mrp: number; photo: PhotoKind;
  colors: ProductColor[]; optionLabel: string; sizes: string[]; stock: Record<string, number>; sellerName: string; category: string; sub: string; rating: number;
}
export interface CouponLite { code: string; description: string; type: "percent" | "flat" | "shipping"; value: number; minOrder: number; maxDiscount?: number }

interface Ctx { products: ProductLite[]; byId: Map<string, ProductLite>; coupons: CouponLite[] }
const StoreDataCtx = createContext<Ctx | null>(null);

export function StoreDataProvider({ products, coupons, children }: { products: ProductLite[]; coupons: CouponLite[]; children: React.ReactNode }) {
  const value = useMemo(() => ({ products, coupons, byId: new Map(products.map((p) => [p.id, p])) }), [products, coupons]);
  return <StoreDataCtx.Provider value={value}>{children}</StoreDataCtx.Provider>;
}

export function useStoreData() {
  const c = useContext(StoreDataCtx);
  if (!c) throw new Error("useStoreData must be used inside <StoreDataProvider>");
  return c;
}
