"use client";

import { Wallet } from "lucide-react";
import { Switch } from "@/components/ui/form";
import { MIN_WALLET_ORDER, nextWalletTier } from "@/lib/wallet";
import { formatINR } from "@/lib/utils";

/**
 * Wallet money on an order — one card used by the bag and every checkout step so they always say the same thing.
 * `canUse` is what the wallet would pay (tier, balance and what is left to pay already applied); `on` says whether it is switched on.
 * Without `onChange` the card is read-only (the bag page).
 */
export function WalletCard({ balance, itemsValue, canUse, on = true, onChange }: {
  balance: number; itemsValue: number; canUse: number; on?: boolean; onChange?: (v: boolean) => void;
}) {
  if (balance <= 0) return null;
  const next = nextWalletTier(itemsValue);
  const unlocked = canUse > 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg-subtle p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-accent"><Wallet className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{onChange ? "Use wallet balance" : "Wallet balance"}</p>
          <p className="text-xs text-muted">
            {formatINR(balance)} available
            {unlocked ? (on ? ` · ${formatINR(canUse)} applied` : ` · ${formatINR(canUse)} can be used`) : ` · use it on items worth ${formatINR(MIN_WALLET_ORDER)}+`}
          </p>
        </div>
        {onChange && unlocked && <Switch label="Use wallet balance" checked={on} onChange={onChange} />}
      </div>
      {unlocked && on && (
        <p className="rounded-xl bg-success-bg px-3 py-2 text-xs text-success">🎉 {formatINR(canUse)} off from your wallet. {formatINR(Math.max(0, balance - canUse))} stays in your wallet for next time.</p>
      )}
      {next && (
        <p className="rounded-xl bg-bg-subtle px-3 py-2 text-xs text-muted">
          💡 Add <strong className="text-fg">{formatINR(next.minOrder - itemsValue)}</strong> more in items to use up to <strong className="text-success">{formatINR(next.maxWallet)}</strong> from your wallet.
        </p>
      )}
    </div>
  );
}
