import { AreaChart, BarChart, Donut, HBars, Legend } from "@/components/shared/charts";
import { PageHeader, Panel, StatCard } from "@/components/shared/blocks";
import { getAnalytics } from "@/lib/data";
import { formatCompactINR, formatNumber } from "@/lib/utils";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const a = await getAnalytics();
  const sum = (x: number[]) => x.reduce((p, c) => p + c, 0);
  const conv = (a.funnel.at(-1)!.value / a.funnel[0].value) * 100;
  return (
    <>
      <PageHeader title="Analytics" subtitle="Last 30 days · all sellers" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatCompactINR(sum(a.revenue))} delta={8.4} />
        <StatCard label="Orders" value={formatNumber(sum(a.orders))} delta={5.1} />
        <StatCard label="Conversion rate" value={`${conv.toFixed(1)}%`} delta={0.6} />
        <StatCard label="Return rate" value="6.8%" delta={-1.2} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Daily revenue"><AreaChart data={a.revenue} labels={a.days} formatY={formatCompactINR} ariaLabel="Daily revenue, last 30 days" /></Panel>
        <Panel title="Weekly revenue"><BarChart data={a.weeklyRevenue} labels={a.weeks} formatY={formatCompactINR} highlightLast ariaLabel="Weekly revenue for the last 7 weeks" /></Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Conversion funnel">
          <ol className="space-y-3">
            {a.funnel.map((s, i) => (
              <li key={s.label}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{s.label}</span><span className="tabular text-muted">{formatNumber(s.value)}{i > 0 && <span className="ml-2 text-xs">({((s.value / a.funnel[i - 1].value) * 100).toFixed(0)}%)</span>}</span></div>
                <div className="h-7 overflow-hidden rounded-lg bg-bg-subtle"><div className="h-full rounded-lg bg-accent" style={{ width: `${(s.value / a.funnel[0].value) * 100}%`, opacity: 1 - i * 0.14 }} /></div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Traffic sources">
          <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <Donut data={a.traffic} center={<div><p className="text-xl font-semibold">{formatCompactINR(sum(a.visitors)).replace("₹", "")}</p><p className="text-xs text-muted">visits</p></div>} />
            <div className="w-full flex-1"><Legend data={a.traffic.map((t) => ({ label: t.label, value: `${t.value}%` }))} /></div>
          </div>
        </Panel>
        <Panel title="Top cities"><HBars rows={a.topCities} format={(n) => `${n}%`} /></Panel>
      </div>

      <Panel title="Orders per day" className="mt-5"><BarChart data={a.orders} labels={a.days} height={180} ariaLabel="Orders per day" /></Panel>
    </>
  );
}
