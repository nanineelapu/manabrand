/** The ₹ every new customer gets in their wallet when they register. Keep in step with grant_welcome_credit() in migration 0014. */
export const WELCOME_CREDIT = 500;

/**
 * Conditional wallet usage tiers based on order total:
 *  - Above ₹2,499: max ₹350
 *  - Above ₹1,999: max ₹300
 *  - Above ₹1,499: max ₹250
 *  - Above ₹999:   max ₹200
 *  - Below ₹999:   ₹0 (minimum order of ₹999 required to use wallet credits)
 */
export const WALLET_TIERS = [
  { minOrder: 2499, maxWallet: 350 },
  { minOrder: 1999, maxWallet: 300 },
  { minOrder: 1499, maxWallet: 250 },
  { minOrder: 999, maxWallet: 200 },
] as const;

export const MIN_WALLET_ORDER = 999;

/** Calculate the maximum wallet credit that can be applied to an order of this total */
export function maxWalletForOrder(orderTotal: number): number {
  const total = Math.floor(Number(orderTotal) || 0);
  for (const tier of WALLET_TIERS) {
    if (total >= tier.minOrder) {
      return tier.maxWallet;
    }
  }
  return 0;
}

/** How much of the wallet can pay for this order: subject to order tiers, balance, and order total. */
export function walletToUse(balance: number, orderTotal: number): number {
  const bal = Math.max(0, Math.floor(Number(balance) || 0));
  const tot = Math.max(0, Math.floor(Number(orderTotal) || 0));
  const maxAllowed = maxWalletForOrder(tot);
  return Math.min(bal, maxAllowed, tot);
}
