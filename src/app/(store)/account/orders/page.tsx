import { PackageOpen } from "lucide-react";
import { AccountPageHeader } from "@/components/store/account-nav";
import { OrderCard } from "@/components/store/order-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import { Tabs } from "@/components/ui/tabs";
import { getMyOrders } from "@/lib/data";

export const metadata = { title: "My orders" };

const groups: Record<string, (s: string) => boolean> = {
  all: () => true,
  active: (s) => !["delivered", "cancelled", "returned"].includes(s),
  delivered: (s) => s === "delivered",
  closed: (s) => s === "cancelled" || s === "returned",
};

export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const sp = await searchParams;
  const tab = (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) ?? "all";
  const all = await getMyOrders();
  const list = all.filter((o) => (groups[tab] ?? groups.all)(o.status));
  const count = (k: string) => all.filter((o) => groups[k](o.status)).length;

  return (
    <>
      <AccountPageHeader title="My orders" subtitle={`${all.length} orders`} />
      <Tabs variant="pill" value={tab} className="mb-5" items={[
        { value: "all", label: "All", count: count("all"), href: "/account/orders" },
        { value: "active", label: "Active", count: count("active"), href: "/account/orders?tab=active" },
        { value: "delivered", label: "Delivered", count: count("delivered"), href: "/account/orders?tab=delivered" },
        { value: "closed", label: "Cancelled", count: count("closed"), href: "/account/orders?tab=closed" },
      ]} />
      {list.length === 0 ? (
        <EmptyState icon={<PackageOpen />} title="No orders here" body="Orders matching this filter will show up here." action={<Button href="/shop">Shop now</Button>} />
      ) : (
        <div className="space-y-3">{list.map((o) => <OrderCard key={o.id} order={o} />)}</div>
      )}
    </>
  );
}
