/** The ₹ every new customer gets in their wallet when they register. Keep in step with grant_welcome_credit() in migration 0014. */
export const WELCOME_CREDIT = 500;

/**
 * How much wallet money one order can use, by the value of the ITEMS in it (after coupons — delivery and COD fees
 * don't count). Keep in step with place_order_wallet() in migration 0015.
 *   ₹999+ → ₹200 · ₹1,499+ → ₹250 · ₹1,999+ → ₹300 · ₹2,499+ → ₹350 · below ₹999 → none
 */
export const WALLET_TIERS = [
  { minOrder: 2499, maxWallet: 350 },
  { minOrder: 1999, maxWallet: 300 },
  { minOrder: 1499, maxWallet: 250 },
  { minOrder: 999, maxWallet: 200 },
] as const;

export const MIN_WALLET_ORDER = 999;

/** The most wallet money an order can use, from the value of its items. */
export function maxWalletForOrder(itemsValue: number): number {
  const v = Math.floor(Number(itemsValue) || 0);
  for (const tier of WALLET_TIERS) if (v >= tier.minOrder) return tier.maxWallet;
  return 0;
}

/** How much wallet money will pay for this order: limited by the tier, the balance and what is left to pay. */
export function walletToUse(balance: number, itemsValue: number, payable: number): number {
  const bal = Math.max(0, Math.floor(Number(balance) || 0));
  const pay = Math.max(0, Math.floor(Number(payable) || 0));
  return Math.min(bal, maxWalletForOrder(itemsValue), pay);
}

/** The next tier up from this item value (to tell the shopper "add ₹X more to use up to ₹Y"), or null at the top. */
export function nextWalletTier(itemsValue: number) {
  const v = Math.floor(Number(itemsValue) || 0);
  return [...WALLET_TIERS].reverse().find((t) => t.minOrder > v) ?? null;
}
