import { Banknote, Landmark, Percent } from "lucide-react";
import { BarChart } from "@/components/shared/charts";
import { PageHeader, Panel } from "@/components/shared/blocks";
import { PayoutsView } from "@/components/shared/payouts-view";
import { DetailRow } from "@/components/ui/display";
import { LockedFeature } from "@/components/seller/locked-feature";
import { getCurrentSeller, getSellerDashboard, getSellerPayouts } from "@/lib/data";
import { formatCompactINR, formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const me = await getCurrentSeller();
  if (me && !me.permissions.view_earnings) return <LockedFeature feature="Earnings and payouts" />;
  const [payouts, d] = await Promise.all([getSellerPayouts(), getSellerDashboard()]);
  const gross = payouts.reduce((a, b) => a + b.gross, 0), fee = payouts.reduce((a, b) => a + b.commission, 0);

  // everything below comes from this seller's own data — nothing is hard-coded
  const pct = me?.commissionPct ?? d.seller.commissionPct;
  const upcoming = payouts.filter((p) => p.status === "scheduled" || p.status === "processing").sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
  const bank = me?.bankLast4 ? `bank account ••${me.bankLast4}` : null;
  const weekly = d.weekly.map((w) => ({ week: w.week, net: Math.round(w.sales * (1 - pct / 100)) }));
  const exampleFee = Math.round((1000 * pct) / 100);
  return (
    <>
      <PageHeader title="Earnings" subtitle="Your sales, the marketplace fee and what you take home" />
      <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-card bg-primary p-6 text-primary-fg shadow-card">
          <div className="flex items-center gap-2 text-sm text-white/70"><Landmark className="size-4" /> Available soon</div>
          <p className="mt-2 font-display text-5xl font-semibold tabular">{formatINR(d.pendingPayout)}</p>
          <p className="mt-1 text-sm text-white/70">
            {upcoming ? `Next payout · ${formatDate(upcoming.date, { day: "numeric", month: "short" })}` : "No payout scheduled yet"}
            {bank ? ` to your ${bank}` : upcoming ? " · add your bank details in Store profile" : ""}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 text-sm">
            <div><p className="flex items-center gap-1.5 text-white/60"><Banknote className="size-4" />Gross sales</p><p className="mt-1 text-lg font-semibold tabular">{formatCompactINR(gross)}</p></div>
            <div><p className="flex items-center gap-1.5 text-white/60"><Percent className="size-4" />Marketplace fee</p><p className="mt-1 text-lg font-semibold tabular">{formatCompactINR(fee)}</p></div>
          </div>
        </section>
        <Panel title="How your fee is calculated">
          <p className="mb-2 text-xs text-muted">Example: a ₹1,000 sale, at your fee of {pct}%</p>
          <dl className="-my-2.5 divide-y divide-line">
            <DetailRow label="Sale price">{formatINR(1000)}</DetailRow>
            <DetailRow label={`Marketplace fee (${pct}%)`}><span className="text-danger">− {formatINR(exampleFee)}</span></DetailRow>
            <DetailRow label="You earn"><span className="text-base font-semibold text-success">{formatINR(1000 - exampleFee)}</span></DetailRow>
          </dl>
        </Panel>
      </div>
      <Panel title="Weekly earnings" className="mb-5">
        {weekly.some((w) => w.net > 0)
          ? <BarChart data={weekly.map((w) => w.net)} labels={weekly.map((w) => w.week)} formatY={formatCompactINR} highlightLast ariaLabel="Weekly net earnings" height={180} />
          : <p className="py-10 text-center text-sm text-muted">Your weekly earnings will appear here once you start receiving orders.</p>}
      </Panel>
      <h2 className="mb-3 text-[15px] font-semibold">Payout history</h2>
      <PayoutsView payouts={payouts} role="seller" />
    </>
  );
}
