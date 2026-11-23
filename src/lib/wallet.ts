/** The ₹ every new customer gets in their wallet when they register. Keep in step with grant_welcome_credit() in migration 0014. */
export const WELCOME_CREDIT = 500;

/** How much of the wallet can pay for this order: all of it that is available, never more than the order itself. */
export const walletToUse = (balance: number, orderTotal: number) => Math.max(0, Math.min(Math.floor(balance), Math.floor(orderTotal)));
