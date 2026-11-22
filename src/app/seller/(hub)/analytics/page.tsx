import { AreaChart, BarChart, HBars } from "@/components/shared/charts";
import { PageHeader, Panel, StatCard } from "@/components/shared/blocks";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { analyse } from "@/lib/analysis";
import { getOrdersForSeller, getSellerProducts, getSellerReturns } from "@/lib/data";
import { formatCompactINR, formatINR } from "@/lib/utils";

export const metadata = { title: "Analytics" };

/** Everything here is worked out from this store's own orders (last 30 days). Visits and conversion need web analytics, so they are not shown. */
export default async function SellerAnalyticsPage() {
  const [orders, products, returns] = await Promise.all([getOrdersForSeller(), getSellerProducts(), getSellerReturns()]);
  const a = analyse({ orders, products, sellers: [], customers: [], returns, range: "30" });
  const none = a.orders === 0;
  const empty = <p className="py-6 text-center text-sm text-muted">No orders in the last 30 days yet.</p>;
  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader title="Analytics" subtitle="How your store is doing · last 30 days, from your real orders" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Sales" value={formatCompactINR(a.gross)} hint="Excludes cancelled orders" />
        <StatCard label="Orders" value={String(a.orders)} hint={`${a.cancelled} cancelled`} />
        <StatCard label="Average order" value={formatINR(a.aov)} hint="Per order" />
        <StatCard label="Repeat buyers" value={`${a.repeatRate.toFixed(0)}%`} hint={`${a.repeat} of ${a.buyers} buyers`} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Daily sales">{none ? empty : <AreaChart data={a.daily.revenue} labels={a.daily.labels} formatY={formatCompactINR} color="#e09a1f" ariaLabel="Your daily sales" />}</Panel>
        <Panel title="Best performing products">{a.topProducts.length ? <HBars rows={a.topProducts.map((p) => ({ label: p.name, value: p.revenue, sub: `${p.units} sold` }))} format={formatCompactINR} /> : empty}</Panel>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Orders per day">{none ? empty : <BarChart data={a.daily.orders} labels={a.daily.labels.map((l, i, all) => (i % Math.ceil(all.length / 6) === 0 ? l : ""))} height={170} color="#1a1613" ariaLabel="Your orders per day" />}</Panel>
        <Panel title="Top towns" action={<span className="text-xs text-muted">by delivery address</span>}>{a.towns.length ? <HBars rows={a.towns.map((t) => ({ label: t.label, value: t.value, sub: `${t.orders} order${t.orders === 1 ? "" : "s"}` }))} format={formatCompactINR} /> : empty}</Panel>
      </div>
    </>
  );
}
