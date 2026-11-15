"use client";

import { useMemo } from "react";
import { UserSearch } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { ListToolbar, useListFilter } from "@/components/shared/list-toolbar";
import { StatusBadge } from "@/components/shared/status";
import { Avatar, Badge, EmptyState } from "@/components/ui/display";
import { formatDate, formatINR } from "@/lib/utils";
import type { Customer } from "@/types";

export function CustomersList({ customers }: { customers: Customer[] }) {
  const f = useListFilter();
  const rows = useMemo(() => {
    const t = f.q.trim().toLowerCase();
    return customers.filter((c) => (f.tab === "all" || (f.tab === "blocked" ? c.status === "blocked" : c.tier === f.tab)) && (!t || `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(t)));
  }, [customers, f.q, f.tab]);
  const n = (k: string) => customers.filter((c) => (k === "all" ? true : k === "blocked" ? c.status === "blocked" : c.tier === k)).length;

  return (
    <>
      <ListToolbar {...f} placeholder="Search name, email, phone or city" tabs={[{ value: "all", label: "All", count: n("all") }, { value: "VIP", label: "VIP", count: n("VIP") }, { value: "Regular", label: "Regular", count: n("Regular") }, { value: "New", label: "New", count: n("New") }, { value: "blocked", label: "Blocked", count: n("blocked") }]} />
      <DataTable rows={rows} rowKey={(c) => c.id} rowHref={(c) => `/admin/customers/${c.id}`} empty={<EmptyState icon={<UserSearch />} title="No customers found" />}
        columns={[
          { key: "n", header: "Customer", mobile: "title", cell: (c) => <span className="flex items-center gap-3"><Avatar name={c.name} size={34} /><span className="min-w-0"><span className="block truncate font-medium">{c.name}</span><span className="block truncate text-xs text-muted">{c.email}</span></span></span> },
          { key: "t", header: "Tier", mobile: "right", cell: (c) => c.status === "blocked" ? <StatusBadge status="blocked" /> : <Badge tone={c.tier === "VIP" ? "accent" : c.tier === "Regular" ? "info" : "neutral"}>{c.tier}</Badge> },
          { key: "c", header: "City", cell: (c) => <span className="text-muted">{c.city}</span> },
          { key: "o", header: "Orders", align: "right", cell: (c) => <span className="tabular">{c.orders}</span> },
          { key: "s", header: "Spent", align: "right", cell: (c) => <span className="tabular font-medium">{formatINR(c.spent)}</span> },
          { key: "j", header: "Joined", mobile: "hide", cell: (c) => <span className="text-muted">{formatDate(c.joined, { month: "short", year: "numeric" })}</span> },
        ]} />
    </>
  );
}
