import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { CustomerActions } from "@/components/admin/customer-actions";
import { PageHeader, Panel, StatCard } from "@/components/shared/blocks";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status";
import { Avatar, Badge } from "@/components/ui/display";
import { getCustomerById, getOrdersForCustomer } from "@/lib/data";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const c = await getCustomerById((await params).id);
  if (!c) notFound();
  const orders = await getOrdersForCustomer(c.id);
  return (
    <>
      <PageHeader title="Customer" back={{ href: "/admin/customers", label: "Customers" }} />
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-card border border-line bg-card p-4 shadow-card md:p-5">
        <Avatar name={c.name} size={56} />
        <div className="mr-auto min-w-0">
          <div className="flex items-center gap-2"><h2 className="text-xl font-semibold">{c.name}</h2><Badge tone={c.tier === "VIP" ? "accent" : "info"}>{c.tier}</Badge></div>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted"><span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{c.email}</span><span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{c.phone}</span><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{c.city}</span></p>
        </div>
        <CustomerActions userId={c.id} name={c.name} initialBlocked={c.status === "blocked"} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Lifetime spend" value={formatINR(c.spent)} hint="All time" />
        <StatCard label="Orders" value={String(c.orders)} hint="All time" />
        <StatCard label="Avg. order" value={formatINR(Math.round(c.spent / Math.max(1, c.orders)))} hint="Lifetime" />
        <StatCard label="Customer since" value={formatDate(c.joined, { month: "short", year: "numeric" })} hint="First order placed" />
      </div>
      <Panel title="Orders" className="mt-5" padded={false}>
        <div className="p-3 md:p-4">
          <DataTable rows={orders} rowKey={(o) => o.id} rowHref={(o) => `/admin/orders/${o.id}`}
            empty={<p className="p-8 text-center text-sm text-muted">This customer hasn’t placed an order in the demo data set.</p>}
            columns={[
              { key: "n", header: "Order", mobile: "title", cell: (o) => o.number },
              { key: "s", header: "Status", mobile: "right", cell: (o) => <StatusBadge status={o.status} /> },
              { key: "d", header: "Date", cell: (o) => <span className="text-muted">{formatDateTime(o.createdAt)}</span> },
              { key: "t", header: "Total", align: "right", cell: (o) => <span className="tabular font-medium">{formatINR(o.total)}</span> },
            ]} />
        </div>
      </Panel>
    </>
  );
}
