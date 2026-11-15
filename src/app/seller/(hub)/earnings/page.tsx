import { Banknote, Landmark, Percent } from "lucide-react";
import { BarChart } from "@/components/shared/charts";
import { PageHeader, Panel } from "@/components/shared/blocks";
import { PayoutsView } from "@/components/shared/payouts-view";
import { DetailRow } from "@/components/ui/display";
import { LockedFeature } from "@/components/seller/locked-feature";
import { getAnalytics, getCurrentSeller, getSellerDashboard, getSellerPayouts } from "@/lib/data";
import { formatCompactINR, formatINR } from "@/lib/utils";

export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const me = await getCurrentSeller();
  if (me && !me.permissions.view_earnings) return <LockedFeature feature="Earnings and payouts" />;
  const [payouts, d, an] = await Promise.all([getSellerPayouts(), getSellerDashboard(), getAnalytics()]);
  const gross = payouts.reduce((a, b) => a + b.gross, 0), fee = payouts.reduce((a, b) => a + b.commission, 0);
  return (
    <>
      <PageHeader title="Earnings" subtitle="Payouts land in your bank 2 working days after each cycle closes" />
      <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-card bg-primary p-6 text-primary-fg shadow-card">
          <div className="flex items-center gap-2 text-sm text-white/70"><Landmark className="size-4" /> Available soon</div>
          <p className="mt-2 font-display text-5xl font-semibold tabular">{formatINR(d.pendingPayout)}</p>
          <p className="mt-1 text-sm text-white/70">Next payout · 18 Nov to HDFC ••4821</p>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5 text-sm">
            <div><p className="flex items-center gap-1.5 text-white/60"><Banknote className="size-4" />Gross sales</p><p className="mt-1 text-lg font-semibold tabular">{formatCompactINR(gross)}</p></div>
            <div><p className="flex items-center gap-1.5 text-white/60"><Percent className="size-4" />Marketplace fee</p><p className="mt-1 text-lg font-semibold tabular">{formatCompactINR(fee)}</p></div>
          </div>
        </section>
        <Panel title="How your fee is calculated">
          <dl className="-my-2.5 divide-y divide-line"><DetailRow label="Sale price (incl. GST)">₹1,299</DetailRow><DetailRow label="Marketplace fee (12%)"><span className="text-danger">− ₹156</span></DetailRow><DetailRow label="Shipping (free above ₹1,499)">₹0</DetailRow><DetailRow label="You earn"><span className="text-base font-semibold text-success">₹1,143</span></DetailRow></dl>
        </Panel>
      </div>
      <Panel title="Weekly earnings" className="mb-5"><BarChart data={an.weeklyRevenue.map((n) => Math.round(n * 0.085 * 0.88))} labels={an.weeks} formatY={formatCompactINR} highlightLast ariaLabel="Weekly net earnings" height={180} /></Panel>
      <h2 className="mb-3 text-[15px] font-semibold">Payout history</h2>
      <PayoutsView payouts={payouts} role="seller" />
    </>
  );
}
