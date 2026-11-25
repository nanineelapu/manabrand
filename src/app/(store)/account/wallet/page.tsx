import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Gift, RotateCcw, SlidersHorizontal, Wallet } from "lucide-react";
import { getWallet } from "@/lib/data";
import { WELCOME_CREDIT } from "@/lib/wallet";
import { formatDateTime, formatINR } from "@/lib/utils";

export const metadata = { title: "My wallet" };

const KIND = { welcome: { icon: Gift, label: "Welcome gift" }, order: { icon: ArrowUpRight, label: "Used on an order" }, refund: { icon: RotateCcw, label: "Refund" }, adjust: { icon: SlidersHorizontal, label: "Adjustment" } } as const;

export default async function WalletPage() {
  const { balance, history } = await getWallet();
  return (
    <div className="space-y-6">
      <section className="rounded-[24px] bg-ink p-6 text-white md:p-8">
        <p className="flex items-center gap-2 text-sm text-white/60"><Wallet className="size-4" /> Wallet balance</p>
        <p className="mt-1 font-display text-5xl font-semibold tabular md:text-6xl">{formatINR(balance)}</p>
        <p className="mt-3 max-w-md text-sm text-white/70">Your wallet money is used automatically at checkout based on your order value. {WELCOME_CREDIT > 0 && <>Every new member gets <b className="text-white">{formatINR(WELCOME_CREDIT)}</b> to start.</>}</p>
        <Link href="/shop" className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-bold text-black hover:bg-white/90">Shop now</Link>
      </section>

      <section className="rounded-card border border-line bg-card p-5 shadow-card md:p-6">
        <h2 className="font-display text-lg font-semibold">How to use your wallet</h2>
        <p className="mt-1 text-xs text-muted">Wallet credits apply automatically at checkout based on your order total:</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-ctl border border-line bg-bg-subtle p-3.5 text-center">
            <p className="text-xs text-muted">Orders &gt; ₹999</p>
            <p className="mt-1 font-semibold text-accent">Use up to ₹200</p>
          </div>
          <div className="rounded-ctl border border-line bg-bg-subtle p-3.5 text-center">
            <p className="text-xs text-muted">Orders &gt; ₹1,499</p>
            <p className="mt-1 font-semibold text-accent">Use up to ₹250</p>
          </div>
          <div className="rounded-ctl border border-line bg-bg-subtle p-3.5 text-center">
            <p className="text-xs text-muted">Orders &gt; ₹1,999</p>
            <p className="mt-1 font-semibold text-accent">Use up to ₹300</p>
          </div>
          <div className="rounded-ctl border border-line bg-bg-subtle p-3.5 text-center">
            <p className="text-xs text-muted">Orders &gt; ₹2,499</p>
            <p className="mt-1 font-semibold text-accent">Use up to ₹350</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">History</h2>
        {history.length === 0 ? <p className="rounded-card border border-line bg-card p-6 text-center text-sm text-muted">Nothing here yet.</p> : (
          <ul className="divide-y divide-line rounded-card border border-line bg-card shadow-card">
            {history.map((t) => {
              const k = KIND[t.kind], Icon = t.amount > 0 ? ArrowDownLeft : k.icon;
              return (
                <li key={t.id} className="flex items-center gap-3.5 px-4 py-3.5 md:px-5">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full ${t.amount > 0 ? "bg-success-bg text-success" : "bg-bg-subtle text-muted"}`}><Icon className="size-[18px]" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{k.label}</span><span className="block truncate text-xs text-muted">{t.note || "—"} · {formatDateTime(t.createdAt)}</span></span>
                  <span className={`shrink-0 text-sm font-semibold tabular ${t.amount > 0 ? "text-success" : ""}`}>{t.amount > 0 ? "+" : "−"} {formatINR(Math.abs(t.amount))}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
