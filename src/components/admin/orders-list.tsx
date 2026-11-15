"use client";

import { useMemo, useState } from "react";
import { Download, SearchX } from "lucide-react";
import { ListToolbar, useListFilter } from "@/components/shared/list-toolbar";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import { Select } from "@/components/ui/form";
import { toast } from "@/lib/stores";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { Order } from "@/types";

const groups: Record<string, (o: Order) => boolean> = {
  all: () => true,
  placed: (o) => o.status === "placed",
  processing: (o) => ["confirmed", "packed"].includes(o.status),
  shipped: (o) => ["shipped", "out_for_delivery"].includes(o.status),
  delivered: (o) => o.status === "delivered",
  closed: (o) => ["cancelled", "returned"].includes(o.status),
};
const methodLabel = { upi: "UPI", card: "Card", cod: "COD", netbanking: "Net banking", wallet: "Wallet" };

export function OrdersList({ orders, base = "/admin", showCustomer = true }: { orders: Order[]; base?: string; showCustomer?: boolean }) {
  const f = useListFilter();
  const [sort, setSort] = useState("new");
  const rows = useMemo(() => {
    const t = f.q.trim().toLowerCase();
    const r = orders.filter((o) => groups[f.tab]?.(o) && (!t || `${o.number} ${o.customerName} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(t)));
    return r.sort((a, b) => sort === "high" ? b.total - a.total : sort === "low" ? a.total - b.total : +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [orders, f.q, f.tab, sort]);
  const count = (k: string) => orders.filter(groups[k]).length;

  return (
    <>
      <ListToolbar {...f} placeholder="Search by order #, customer or item" tabs={[
        { value: "all", label: "All", count: count("all") }, { value: "placed", label: "To confirm", count: count("placed") },
        { value: "processing", label: "Processing", count: count("processing") }, { value: "shipped", label: "In transit", count: count("shipped") },
        { value: "delivered", label: "Delivered", count: count("delivered") }, { value: "closed", label: "Cancelled / Returned", count: count("closed") },
      ]} right={<>
        <Select aria-label="Sort orders" value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 w-auto min-w-40"><option value="new">Newest first</option><option value="high">Value: high → low</option><option value="low">Value: low → high</option></Select>
        <Button variant="outline" size="sm" className="h-10" onClick={() => toast.success(`Exported ${rows.length} orders (demo)`)}><Download className="size-4" /> Export</Button>
      </>} />
      <DataTable rows={rows} rowKey={(o) => o.id} rowHref={(o) => `${base}/orders/${o.id}`}
        empty={<EmptyState icon={<SearchX />} title="No orders found" body="Try a different search or status." />}
        columns={[
          { key: "n", header: "Order", cell: (o) => <span className="font-semibold">{o.number}</span>, mobile: "title" },
          ...(showCustomer ? [{ key: "c", header: "Customer", cell: (o: Order) => o.customerName, mobile: "sub" as const }] : []),
          { key: "s", header: "Status", cell: (o) => <StatusBadge status={o.status} />, mobile: "right" },
          { key: "i", header: "Items", cell: (o) => <span className="text-muted">{o.items.reduce((a, b) => a + b.qty, 0)} · {o.items[0].name.slice(0, 24)}{o.items[0].name.length > 24 ? "…" : ""}</span>, mobile: "hide" },
          { key: "p", header: "Payment", cell: (o) => <span className="flex items-center gap-2 text-[13px]">{methodLabel[o.payment.method]} <StatusBadge status={o.payment.status} /></span>, mobile: "row" },
          { key: "d", header: "Date", cell: (o) => <span className="text-muted">{formatDateTime(o.createdAt)}</span>, mobile: "row" },
          { key: "t", header: "Total", cell: (o) => <span className="font-semibold tabular">{formatINR(o.total)}</span>, align: "right", mobile: "row" },
        ]} />
    </>
  );
}
