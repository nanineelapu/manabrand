/**
 * "Buy now": the one product the shopper tapped Buy now on. It lives for this browser tab only (sessionStorage) and is
 * completely separate from the bag, so buying one thing straight away never drags the bag's other items into the order.
 */
export interface BuyNowLine { productId: string; color: string; size: string; qty: number }

const KEY = "mana-buynow";
const EVT = "mana_buynow_updated";

export function setBuyNow(line: BuyNowLine | null) {
  try {
    if (line) sessionStorage.setItem(KEY, JSON.stringify(line)); else sessionStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVT));
  } catch { /* private mode: the redirect still works for this page view */ }
}

export function subscribeBuyNow(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); };
}

/** The raw stored text (a string compares by value, so React only re-renders when it really changes). */
export function getBuyNowSnapshot(): string | null {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}

export function parseBuyNow(raw: string | null): BuyNowLine | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<BuyNowLine>;
    if (typeof v.productId !== "string" || typeof v.size !== "string") return null;
    return { productId: v.productId, color: String(v.color ?? ""), size: v.size, qty: Math.max(1, Math.min(10, Math.floor(Number(v.qty) || 1))) };
  } catch { return null; }
}
