import { AreaChart, BarChart, HBars } from "@/components/shared/charts";
import { PageHeader, Panel, StatCard } from "@/components/shared/blocks";
import { getAnalytics, getSellerProducts } from "@/lib/data";
import { formatCompactINR, formatNumber } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function SellerAnalyticsPage() {
  const [a, products] = await Promise.all([getAnalytics(), getSellerProducts()]);
  const rev = a.revenue.map((n) => Math.round(n * 0.085));
  const views = a.visitors.map((n) => Math.round(n * 0.11));
  const top = [...products].sort((x, y) => y.sold * y.price - x.sold * x.price).slice(0, 5).map((p) => ({ label: p.name, value: p.sold * p.price, sub: `${p.sold} sold` }));
  return (
    <>
      <PageHeader title="Analytics" subtitle="How shoppers find and buy from your store · last 30 days" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Sales" value={formatCompactINR(rev.reduce((x, y) => x + y, 0))} delta={9.2} spark={rev.slice(-14)} />
        <StatCard label="Store visits" value={formatNumber(views.reduce((x, y) => x + y, 0))} delta={12.5} spark={views.slice(-14)} />
        <StatCard label="Conversion" value="3.4%" delta={0.4} />
        <StatCard label="Repeat buyers" value="28%" delta={2.1} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Daily sales"><AreaChart data={rev} labels={a.days} formatY={formatCompactINR} color="#e09a1f" ariaLabel="Your daily sales" /></Panel>
        <Panel title="Best performing products"><HBars rows={top} format={formatCompactINR} /></Panel>
      </div>
      <Panel title="Store visits per day" className="mt-5"><BarChart data={views} labels={a.days} height={170} color="#1a1613" ariaLabel="Your store visits per day" /></Panel>
    </>
  );
}
