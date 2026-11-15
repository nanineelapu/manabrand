import Link from "next/link";
import { ChevronRight, Package, Wallet } from "lucide-react";
import { AccountMenuList } from "@/components/store/account-nav";
import { OrderCard } from "@/components/store/order-card";
import { Avatar, Badge } from "@/components/ui/display";
import { getCurrentCustomer, getMyOrders } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const [me, orders] = await Promise.all([getCurrentCustomer(), getMyOrders()]);
  const active = orders.filter((o) => !["delivered", "cancelled", "returned"].includes(o.status));
  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4 rounded-[24px] bg-ink p-5 text-white md:p-7">
        <Avatar name={me.name} size={64} tone="#cc4a33" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white/60">Welcome back</p>
          <h1 className="truncate font-display text-2xl font-semibold md:text-3xl">{me.name}</h1>
          <p className="truncate text-sm text-white/60">{me.email} · Member since {formatDate(me.joined, { month: "short", year: "numeric" })}</p>
        </div>
        <Badge tone="accent" className="hidden bg-gold-400 text-ink sm:inline-flex">{me.tier} member</Badge>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {[[Package, "Orders", String(orders.length)], [Wallet, "Spent", formatINR(me.spent)]].map(([I, l, v]) => {
          const Icon = I as typeof Package;
          return (
            <div key={l as string} className="rounded-card border border-line bg-card p-3.5 text-center shadow-card md:p-5">
              <Icon className="mx-auto size-5 text-accent" /><p className="mt-2 text-lg font-semibold tabular md:text-xl">{v as string}</p><p className="text-xs text-muted">{l as string}</p>
            </div>
          );
        })}
      </div>

      <AccountMenuList />

      {active.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">On the way</h2><Link href="/account/orders" className="inline-flex items-center text-sm font-medium">All orders <ChevronRight className="size-4" /></Link></div>
          <div className="space-y-3">{active.slice(0, 2).map((o) => <OrderCard key={o.id} order={o} />)}</div>
        </section>
      )}
    </div>
  );
}
