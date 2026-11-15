import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, PackageCheck, PackageOpen, RotateCcw, ShoppingBag, Sparkles, Truck, Wallet } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { BarChart } from "@/components/shared/charts";
import { Panel } from "@/components/shared/blocks";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { Progress, Rating } from "@/components/ui/display";
import { getAnalytics, getSellerDashboard } from "@/lib/data";
import { formatCompactINR, formatDate, formatINR, timeAgo } from "@/lib/utils";

export const metadata = { title: "Home" };

export default async function SellerHome() {
  const [d, an] = await Promise.all([getSellerDashboard(), getAnalytics()]);
  const tasks = [
    { href: "/seller/orders?status=placed", icon: ShoppingBag, n: d.toConfirm, label: "New orders", hint: "Confirm to start", tone: "bg-gold-100 text-gold-500" },
    { href: "/seller/orders?status=processing", icon: PackageOpen, n: d.toPack, label: "To pack", hint: "Ready to be packed", tone: "bg-info-bg text-info" },
    { href: "/seller/orders?status=processing", icon: Truck, n: d.toShip, label: "To ship", hint: "Awaiting pickup", tone: "bg-accent-soft text-accent-soft-fg" },
    { href: "/seller/returns", icon: RotateCcw, n: d.returnsOpen, label: "Returns", hint: "Need your reply", tone: "bg-danger-bg text-danger" },
  ];
  const weekly = an.weeklyRevenue.map((n) => Math.round(n * 0.085));
  const health = [{ t: "Store profile complete", ok: true }, { t: "10+ products listed", ok: d.seller.productCount >= 10 }, { t: "Ship within 48 hours", ok: true }, { t: "Reply to 3 new reviews", ok: false }];
  const done = health.filter((h) => h.ok).length;

  return (
    <>
      <header className="mb-5 md:mb-7">
        <p className="text-sm font-medium text-muted">{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(new Date())}</p>
        <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight md:text-4xl">Namaste, {d.seller.owner.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-[15px] text-muted">{d.toConfirm + d.toPack + d.toShip > 0 ? <>You have <b className="text-fg">{d.toConfirm + d.toPack + d.toShip} orders</b> that need you today.</> : "You’re all caught up — nice work!"}</p>
      </header>

      {/* Today's tasks */}
      <section aria-label="Today’s tasks" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {tasks.map((t) => (
          <Link key={t.label} href={t.href} className="group relative overflow-hidden rounded-card border border-line bg-card p-4 shadow-card transition-transform active:scale-[0.98] md:p-5">
            <span className={`grid size-11 place-items-center rounded-2xl ${t.tone}`}><t.icon className="size-5" /></span>
            <p className="mt-4 font-display text-4xl font-semibold leading-none tabular">{t.n}</p>
            <p className="mt-1.5 text-[15px] font-semibold">{t.label}</p>
            <p className="text-xs text-muted">{t.hint}</p>
            <ArrowRight className="absolute right-4 top-4 size-4 text-subtle transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Sales */}
        <Panel title="Your sales">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[["Today", d.todaySales], ["This week", d.weekSales], ["This month", d.monthSales]].map(([l, v], i) => (
              <div key={l as string} className={`rounded-2xl px-2 py-3.5 ${i === 0 ? "bg-primary text-primary-fg" : "bg-bg-subtle"}`}>
                <p className={`text-xs ${i === 0 ? "text-white/70" : "text-muted"}`}>{l as string}</p>
                <p className="mt-1 text-lg font-semibold tabular md:text-xl">{formatCompactINR(v as number)}</p>
              </div>
            ))}
          </div>
          <BarChart data={weekly} labels={an.weeks} formatY={formatCompactINR} highlightLast ariaLabel="Your weekly sales for the last 7 weeks" height={190} className="mt-5" />
        </Panel>

        <div className="space-y-5">
          {/* Payout */}
          <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-gold-400 to-gold-500 p-5 text-ink shadow-card">
            <Wallet className="absolute -right-3 -top-3 size-24 rotate-12 text-white/20" />
            <p className="text-sm font-medium text-ink/70">Next payout</p>
            <p className="mt-1 font-display text-4xl font-semibold tabular">{formatINR(d.pendingPayout)}</p>
            <p className="mt-1 text-sm text-ink/70">Arrives by {formatDate("2026-11-18", { day: "numeric", month: "long" })} · HDFC ••4821</p>
            <Button href="/seller/earnings" variant="primary" size="sm" className="mt-4 rounded-full">View earnings <ArrowRight className="size-4" /></Button>
          </section>

          {/* Health */}
          <Panel title="Store health" action={<span className="text-sm font-semibold tabular">{done}/{health.length}</span>}>
            <Progress value={(done / health.length) * 100} tone="success" label="Store health" className="mb-4" />
            <ul className="space-y-3">
              {health.map((h) => <li key={h.t} className="flex items-center gap-3 text-sm">{h.ok ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <Circle className="size-5 shrink-0 text-line-strong" />}<span className={h.ok ? "text-muted line-through decoration-line-strong" : "font-medium"}>{h.t}</span></li>)}
            </ul>
            <p className="mt-4 flex items-start gap-2 rounded-ctl bg-accent-soft p-3 text-[13px] text-accent-soft-fg"><Sparkles className="mt-0.5 size-4 shrink-0" />Stores that reply to reviews within 24h get 18% more repeat buyers.</p>
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Running low" action={<Link href="/seller/inventory" className="text-sm font-medium text-accent">Restock</Link>} padded={false}>
          {d.lowStock.length === 0 ? <p className="p-5 text-sm text-muted">All stocked up 🎉</p> : (
            <ul className="divide-y divide-line">
              {d.lowStock.map(({ product: p, units }) => (
                <li key={p.id} className="flex items-center gap-3.5 px-4 py-3 md:px-5">
                  <span className="aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-lg"><ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.images?.[0]} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className={`text-xs font-semibold ${units <= 8 ? "text-danger" : "text-warning"}`}>{units === 0 ? "Out of stock" : `Only ${units} left`}</span></span>
                  <Button href={`/seller/products/${p.id}`} size="sm" variant="outline">Update</Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Best sellers" action={<Link href="/seller/products" className="text-sm font-medium text-accent">All products</Link>} padded={false}>
          <ul className="divide-y divide-line">
            {d.bestSellers.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3.5 px-4 py-3 md:px-5">
                <span className="w-5 text-center font-display text-lg font-semibold text-subtle">{i + 1}</span>
                <span className="aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-lg"><ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.images?.[0]} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><Rating value={p.rating} size="sm" /></span>
                <span className="text-right text-xs"><span className="block text-sm font-semibold tabular">{p.sold}</span><span className="text-muted">sold</span></span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent orders" className="mt-5" action={<Link href="/seller/orders" className="text-sm font-medium text-accent">View all</Link>} padded={false}>
        <ul className="divide-y divide-line">
          {d.recent.map((o) => (
            <li key={o.id}>
              <Link href={`/seller/orders/${o.id}`} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-bg-subtle/60 md:px-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-100"><PackageCheck className="size-[18px] text-gold-500" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{o.number}</span><span className="block truncate text-xs text-muted">{o.items[0].name}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""} · {timeAgo(o.createdAt)}</span></span>
                <span className="text-right"><span className="block text-sm font-semibold tabular">{formatINR(o.total)}</span><StatusBadge status={o.status} className="mt-0.5" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
