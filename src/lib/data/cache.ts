interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const pendingFetches = new Map<string, Promise<unknown>>();

/**
 * In-memory TTL cache with concurrent promise deduplication.
 * Eliminates redundant Supabase queries during navigation and layout prefetching.
 */
export async function withMemoryCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = memoryCache.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.value as T;
  }

  // Deduplicate in-flight fetches so concurrent requests share 1 single database call
  const pending = pendingFetches.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const p = fetcher()
    .then((val) => {
      memoryCache.set(key, { value: val, expiresAt: Date.now() + ttlMs });
      pendingFetches.delete(key);
      return val;
    })
    .catch((err) => {
      pendingFetches.delete(key);
      throw err;
    });

  pendingFetches.set(key, p);
  return p;
}

/**
 * Invalidate cached items across the data layer.
 * Call this when content or products are mutated.
 */
export function clearDataCache(keyPattern?: string) {
  if (!keyPattern) {
    memoryCache.clear();
    return;
  }
  for (const k of memoryCache.keys()) {
    if (k.includes(keyPattern)) {
      memoryCache.delete(k);
    }
  }
}
