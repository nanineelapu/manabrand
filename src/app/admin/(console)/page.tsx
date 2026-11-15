import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/session";
import { AlertTriangle, ArrowRight, Download, IndianRupee, Package, ShoppingCart, Store, Users, RotateCcw, MessageSquareWarning, Eye } from "lucide-react";
import { Donut, HBars, Legend, AreaChart } from "@/components/shared/charts";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader, Panel, StatCard } from "@/components/shared/blocks";
import { StatusBadge, statusLabel } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/brand/product-image";
import { getAdminDashboard, getAnalytics } from "@/lib/data";
import { chart } from "@/lib/design/tokens";
import { formatCompactINR, formatINR, formatNumber, timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

const last = (a: number[], n: number, off = 0) => a.slice(a.length - n - off, a.length - off).reduce((x, y) => x + y, 0);
const delta = (a: number[]) => ((last(a, 7) - last(a, 7, 7)) / last(a, 7, 7)) * 100;
const spark = (a: number[]) => a.slice(-14);

export default async function AdminDashboard() {
  const [d, an, me] = await Promise.all([getAdminDashboard(), getAnalytics(), getSessionProfile()]);
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(now)) % 24;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(now);
  const statusColor: Record<string, string> = { placed: chart.series[4], confirmed: "#7fa6d1", packed: chart.series[2], shipped: chart.series[0], out_for_delivery: "#e08a76", delivered: chart.series[3], cancelled: "#9a8f85", returned: chart.series[5] };

  const attention = [
    { href: "/admin/orders?status=placed", icon: ShoppingCart, n: d.pendingOrders, label: "Orders to confirm", tone: "text-info bg-info-bg" },
    { href: "/admin/sellers?status=pending", icon: Store, n: d.pendingSellers, label: "Seller applications", tone: "text-warning bg-warning-bg" },
    { href: "/admin/returns", icon: RotateCcw, n: d.openReturns, label: "Return requests", tone: "text-accent-soft-fg bg-accent-soft" },
    { href: "/admin/reviews", icon: MessageSquareWarning, n: d.flaggedReviews, label: "Reviews to moderate", tone: "text-danger bg-danger-bg" },
  ];

  return (
    <>
      <PageHeader title={`${greeting}${me ? `, ${me.name.split(" ")[0]}` : ""}`} subtitle={`Here’s what’s happening across ManaBrand today · ${today}`}
        actions={<><Button variant="outline" size="sm" href="/" ><Eye className="size-4" /> Storefront</Button><Button size="sm"><Download className="size-4" /> Export report</Button></>} />

      {/* Needs attention — first thing on mobile */}
      <section aria-label="Needs attention" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {attention.map((a) => (
          <Link key={a.label} href={a.href} className="group flex items-center gap-3 rounded-card border border-line bg-card p-3.5 shadow-card transition-colors hover:border-line-strong md:p-4">
            <span className={`grid size-10 shrink-0 place-items-center rounded-ctl ${a.tone}`}><a.icon className="size-5" /></span>
            <span className="min-w-0"><span className="block text-xl font-semibold leading-none tabular">{a.n}</span><span className="mt-1 block text-xs leading-tight text-muted">{a.label}</span></span>
            <ArrowRight className="ml-auto hidden size-4 text-subtle transition-transform group-hover:translate-x-0.5 md:block" />
          </Link>
        ))}
      </section>

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <StatCard label="Revenue (30d)" value={formatCompactINR(d.revenue30)} delta={delta(an.revenue)} spark={spark(an.revenue)} icon={<IndianRupee />} />
        <StatCard label="Orders (30d)" value={formatNumber(d.orders30)} delta={delta(an.orders)} spark={spark(an.orders)} icon={<Package />} />
        <StatCard label="Avg. order value" value={formatINR(d.aov)} delta={3.4} spark={[3, 4, 3.6, 4.4, 4, 4.8, 5, 4.7]} icon={<ShoppingCart />} />
        <StatCard label="Visitors (30d)" value={formatCompactINR(d.visitors30).replace("₹", "")} delta={delta(an.visitors)} spark={spark(an.visitors)} icon={<Users />} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="Revenue" action={<span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-medium text-muted">Last 30 days</span>}>
          <AreaChart data={an.revenue} labels={an.days} formatY={(n) => formatCompactINR(n)} ariaLabel="Daily revenue for the last 30 days" />
        </Panel>
        <Panel title="Orders by status">
          <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
            <Donut data={d.statusCounts.map((s) => ({ label: statusLabel(s.status), value: s.count, color: statusColor[s.status] }))} center={<div><p className="text-2xl font-semibold tabular">{d.statusCounts.reduce((a, b) => a + b.count, 0)}</p><p className="text-xs text-muted">orders</p></div>} />
            <div className="w-full min-w-0 flex-1"><Legend data={d.statusCounts.map((s) => ({ label: statusLabel(s.status), value: String(s.count), color: statusColor[s.status] }))} /></div>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-[15px] font-semibold">Recent orders</h2><Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-accent">View all <ArrowRight className="size-4" /></Link></div>
          <DataTable rows={d.recentOrders} rowKey={(o) => o.id} rowHref={(o) => `/admin/orders/${o.id}`} columns={[
            { key: "n", header: "Order", cell: (o) => o.number, mobile: "title" },
            { key: "c", header: "Customer", cell: (o) => o.customerName, mobile: "sub" },
            { key: "s", header: "Status", cell: (o) => <StatusBadge status={o.status} />, mobile: "right" },
            { key: "t", header: "Total", cell: (o) => <span className="tabular font-medium">{formatINR(o.total)}</span>, align: "right" },
            { key: "w", header: "When", cell: (o) => <span className="text-muted">{timeAgo(o.createdAt)}</span>, mobile: "hide" },
          ]} />
        </div>
        <div className="space-y-5">
          <Panel title="Top products" action={<Link href="/admin/products" className="text-sm font-medium text-accent">All</Link>}><HBars rows={d.topProducts} format={formatCompactINR} /></Panel>
          <Panel title="Top sellers" action={<Link href="/admin/sellers" className="text-sm font-medium text-accent">All</Link>}><HBars rows={d.topSellers} format={formatCompactINR} /></Panel>
        </div>
      </div>

      <Panel title="Low stock" className="mt-5" action={<span className="inline-flex items-center gap-1 text-xs font-medium text-warning"><AlertTriangle className="size-3.5" /> {d.lowStock.length} items</span>} padded={false}>
        <ul className="divide-y divide-line">
          {d.lowStock.map(({ product: p, units }) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3.5 px-4 py-3 hover:bg-bg-subtle/60 md:px-5">
                <span className="size-12 shrink-0 overflow-hidden rounded-lg"><ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.images?.[0]} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="text-xs text-muted">{p.subcategory}</span></span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular ${units === 0 ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning"}`}>{units === 0 ? "Out of stock" : `${units} left`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
