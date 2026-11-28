import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

/**
 * Shared cache for PUBLIC catalogue reads (products, categories, banners, coupons, reviews…).
 * It is Next's data cache, so every server instance on Vercel shares it — a visitor on a cold instance still gets a
 * cached answer instead of waiting for Supabase. Never put anything user-specific in here (it is shared by everyone).
 *
 * `ttlMs` is how long an answer is trusted; an admin edit clears everything straight away (see clearDataCache).
 */
const TAG = "mana-data";

export function cachedQuery<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  return unstable_cache(fetcher, ["mana-data", key], { revalidate: Math.max(1, Math.round(ttlMs / 1000)), tags: [TAG] })();
}

/** Call after content or products are changed: drops every cached query and every cached storefront page. */
export function clearDataCache() {
  revalidateTag(TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

/** A stable cache key for a query object (same fields in any order give the same key). */
export function queryKey(o: object): string {
  return JSON.stringify(Object.entries(o as Record<string, unknown>).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)));
}
