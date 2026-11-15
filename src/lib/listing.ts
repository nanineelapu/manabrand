import type { ProductQuery } from "@/lib/data";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) => (one(v) ? one(v)!.split(",").filter(Boolean) : undefined);
const num = (v: string | string[] | undefined) => { const n = Number(one(v)); return one(v) && Number.isFinite(n) ? n : undefined; };

/** URL → query. Single source of truth for every listing route. */
export function parseListingParams(sp: SP): ProductQuery {
  return {
    q: one(sp.q), sub: one(sp.sub), sort: one(sp.sort), min: num(sp.min), max: num(sp.max),
    sizes: list(sp.size), colors: list(sp.color), sellers: list(sp.seller), rating: num(sp.rating), discount: num(sp.discount),
    page: num(sp.page) ?? 1, pageSize: 12,
  };
}

export const FILTER_KEYS = ["sub", "min", "max", "size", "color", "seller", "rating", "discount"] as const;

export const PRICE_BANDS = [
  { label: "Under ₹1,000", min: undefined, max: 999 },
  { label: "₹1,000 – ₹2,999", min: 1000, max: 2999 },
  { label: "₹3,000 – ₹7,999", min: 3000, max: 7999 },
  { label: "₹8,000 & above", min: 8000, max: undefined },
] as const;
