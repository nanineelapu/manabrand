import Link from "next/link";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { AreaChart, BarChart, Donut, HBars, Legend } from "@/components/shared/charts";
import { PageHeader, Panel, StatCard } from "@/components/shared/blocks";
import { getAllCustomers, getAllOrders, getAllProducts, getAllReturns, getAllSellers } from "@/lib/data";
import { analyse, RANGES, type Range } from "@/lib/analysis";
import { cn, formatCompactINR, formatINR, formatNumber } from "@/lib/utils";

export const metadata = { title: "Business analysis" };

const TONE = { good: { icon: CheckCircle2, cls: "text-success" }, warn: { icon: AlertTriangle, cls: "text-warning" }, bad: { icon: XCircle, cls: "text-danger" } } as const;

export default async function BusinessPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const sp = await searchParams;
  const range: Range = RANGES.some((r) => r.id === sp.range) ? (sp.range as Range) : "30";
  const [orders, products, sellers, customers, returns] = await Promise.all([getAllOrders(), getAllProducts(), getAllSellers(), getAllCustomers(), getAllReturns()]);
  const a = analyse({ orders, products, sellers, customers, returns, range });
  const money = (n: number) => formatCompactINR(n);
  const hasSales = a.orders > 0;

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader
        title="Business analysis"
        subtitle="Sales, customers, sellers and stock — worked out from your real orders."
        actions={
          <nav aria-label="Time range" className="inline-flex rounded-full border border-line bg-card p-1">
            {RANGES.map((r) => (
              <Link key={r.id} href={`/admin/business?range=${r.id}`} aria-current={r.id === range ? "true" : undefined}
                className={cn("rounded-full px-3 py-1 text-[13px] font-medium", r.id === range ? "bg-fg text-bg" : "text-muted hover:text-fg")}>{r.label}</Link>
            ))}
          </nav>
        }
      />

      {/* what to do next */}
      <Panel title="What this says" className="mb-5">
        {a.insights.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {a.insights.map((i) => {
              const T = TONE[i.tone];
              return (
                <li key={i.title} className="flex gap-3 rounded-ctl border border-line p-3">
                  <T.icon className={cn("mt-0.5 size-5 shrink-0", T.cls)} />
                  <div className="min-w-0"><p className="text-sm font-semibold">{i.title}</p><p className="mt-0.5 text-[13px] text-muted">{i.body}</p></div>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted">Nothing needs attention right now.</p>}
      </Panel>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Sales booked" value={money(a.gross)} delta={a.growth} hint={a.growth === undefined ? "Excludes cancelled orders" : undefined} />
        <StatCard label="Orders" value={formatNumber(a.orders)} hint={`${formatNumber(a.cancelled)} cancelled`} />
        <StatCard label="Average order value" value={formatINR(a.aov)} hint="Per order" />
        <StatCard label="Platform earnings" value={money(a.commission)} hint="Seller commission" />
        <StatCard label="Delivered revenue" value={money(a.deliveredRevenue)} hint="Orders already delivered" />
        <StatCard label="Repeat buyers" value={`${a.repeatRate.toFixed(0)}%`} hint={`${a.repeat} of ${a.buyers} buyers`} />
        <StatCard label="Return rate" value={`${a.returnRate.toFixed(1)}%`} hint={`${a.returnsCount} requests`} />
        <StatCard label="Avg. delivery time" value={a.avgDeliveryDays ? `${a.avgDeliveryDays.toFixed(1)} days` : "—"} hint="Placed → delivered" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Revenue">
          {hasSales ? <AreaChart data={a.daily.revenue} labels={a.daily.labels} formatY={money} ariaLabel="Daily revenue" /> : <Empty />}
        </Panel>
        <Panel title="Orders per day">
          {hasSales ? <BarChart data={a.daily.orders} labels={a.daily.labels.map((l, i, all) => (i % Math.ceil(all.length / 6) === 0 ? l : ""))} height={220} ariaLabel="Orders per day" /> : <Empty />}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Sales by category">
          {a.categories.length ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
              <Donut data={a.categories} center={<div><p className="text-lg font-semibold">{money(a.gross)}</p><p className="text-xs text-muted">booked</p></div>} />
              <div className="w-full flex-1"><Legend data={a.categories.map((c) => ({ label: c.label, value: money(c.value) }))} /></div>
            </div>
          ) : <Empty />}
        </Panel>
        <Panel title="Best sub-categories">{a.subcategories.length ? <HBars rows={a.subcategories} format={money} /> : <Empty />}</Panel>
        <Panel title="How customers pay">
          {a.payments.length ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
              <Donut data={a.payments} center={<div><p className="text-lg font-semibold">{a.codShare.toFixed(0)}%</p><p className="text-xs text-muted">COD</p></div>} />
              <div className="w-full flex-1"><Legend data={a.payments.map((p) => ({ label: p.label, value: `${p.value}` }))} /></div>
            </div>
          ) : <Empty />}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Top towns" action={<span className="text-xs text-muted">by delivery address</span>}>
          {a.towns.length ? <HBars rows={a.towns.map((t) => ({ label: t.label, value: t.value, sub: `${t.orders} order${t.orders === 1 ? "" : "s"}${t.pincodes ? ` · ${t.pincodes}` : ""}` }))} format={money} /> : <Empty />}
        </Panel>
        <Panel title="Orders: how far they get">
          {a.funnel[0].value ? (
            <ol className="space-y-3">
              {a.funnel.map((s, i) => (
                <li key={s.label}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{s.label}</span><span className="tabular text-muted">{s.value}{i > 0 && a.funnel[i - 1].value > 0 && <span className="ml-2 text-xs">({Math.round((s.value / a.funnel[i - 1].value) * 100)}%)</span>}</span></div>
                  <div className="h-6 overflow-hidden rounded-lg bg-bg-subtle"><div className="h-full rounded-lg bg-accent" style={{ width: `${(s.value / a.funnel[0].value) * 100}%`, opacity: 1 - i * 0.16 }} /></div>
                </li>
              ))}
            </ol>
          ) : <Empty />}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Top products">
          {a.topProducts.length ? (
            <ul className="divide-y divide-line text-sm">
              {a.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 text-xs font-semibold text-muted tabular">{i + 1}</span>
                  <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-accent">{p.name}</Link>
                  <span className="text-xs text-muted tabular">{p.units} sold</span>
                  <span className="w-20 text-right font-semibold tabular">{money(p.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : <Empty />}
        </Panel>
        <Panel title="Top sellers" action={<Link href="/admin/sellers" className="text-[13px] font-medium text-accent">All sellers</Link>}>
          {a.sellers.length ? (
            <ul className="divide-y divide-line text-sm">
              {a.sellers.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/admin/sellers/${s.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-accent">{s.name}</Link>
                  <span className="text-xs text-muted tabular">{s.orders} orders</span>
                  <span className="w-20 text-right font-semibold tabular">{money(s.revenue)}</span>
                  <span className="hidden w-24 text-right text-xs text-muted tabular sm:block">{money(s.commission)} fee</span>
                </li>
              ))}
            </ul>
          ) : <Empty />}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Stock health">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Mini label="Live products" value={a.inventory.live} />
            <Mini label="Drafts" value={a.inventory.drafts} />
            <Mini label="Awaiting review" value={a.inventory.pendingReview} bad={a.inventory.pendingReview > 0} />
            <Mini label="Out of stock" value={a.inventory.outOfStock} bad={a.inventory.outOfStock > 0} />
            <Mini label="No sales yet" value={a.inventory.noSales} />
            <Mini label="Avg. discount" value={`${a.discountDepth.toFixed(0)}%`} />
          </dl>
          {a.inventory.low.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Almost out</p>
              <ul className="space-y-1.5 text-sm">
                {a.inventory.low.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3"><Link href={`/admin/products/${p.id}`} className="truncate hover:text-accent">{p.name}</Link><span className="shrink-0 font-semibold text-warning tabular">{p.left} left</span></li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
        <Panel title="Customers">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Mini label="New in period" value={a.newCustomers} />
            <Mini label="Buyers (all time)" value={a.buyers} />
            <Mini label="Repeat buyers" value={a.repeat} />
            <Mini label="Repeat rate" value={`${a.repeatRate.toFixed(0)}%`} />
          </dl>
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Top spenders</p>
            <ul className="space-y-1.5 text-sm">
              {a.topCustomers.map((c) => (
                <li key={c.id} className="flex justify-between gap-3"><Link href={`/admin/customers/${c.id}`} className="truncate hover:text-accent">{c.name}</Link><span className="shrink-0 font-semibold tabular">{money(c.spent)}</span></li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel title="Orders & returns">
          {a.statuses.length ? <HBars rows={a.statuses.map((s) => ({ label: s.label.charAt(0).toUpperCase() + s.label.slice(1), value: s.value }))} format={(n) => `${n}`} /> : <Empty />}
          {a.returnReasons.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Top return reasons</p>
              <ul className="space-y-1.5 text-sm">{a.returnReasons.map((r) => <li key={r.label} className="flex justify-between gap-3"><span className="truncate">{r.label}</span><span className="font-semibold tabular">{r.value}</span></li>)}</ul>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function Empty() { return <p className="py-6 text-center text-sm text-muted">No data for this period yet.</p>; }
function Mini({ label, value, bad }: { label: string; value: string | number; bad?: boolean }) {
  return <div className="rounded-ctl bg-bg-subtle p-3"><dt className="text-xs text-muted">{label}</dt><dd className={cn("mt-0.5 text-lg font-semibold tabular", bad && "text-danger")}>{value}</dd></div>;
}
