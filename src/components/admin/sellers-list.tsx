"use client";

import { useMemo, useState } from "react";
import { Check, Store, X } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { ListToolbar, useListFilter } from "@/components/shared/list-toolbar";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { EmptyState, Rating } from "@/components/ui/display";
import { setSellerStatus } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { formatCompactINR, formatDate } from "@/lib/utils";
import type { Seller, SellerStatus } from "@/types";

export function SellersList({ sellers }: { sellers: Seller[] }) {
  const f = useListFilter();
  const [st, setSt] = useState<Record<string, SellerStatus>>({});
  const { act } = useAct();
  const eff = (s: Seller) => st[s.id] ?? s.status;
  const decide = (s: Seller, to: SellerStatus) =>
    act(() => setSellerStatus(s.id, to as "active" | "rejected" | "suspended"), { success: to === "active" ? `${s.name} approved — they can start listing` : `${s.name} rejected`, onOk: () => setSt((p) => ({ ...p, [s.id]: to })) });

  const rows = useMemo(() => {
    const t = f.q.trim().toLowerCase();
    return sellers.filter((s) => (f.tab === "all" || eff(s) === f.tab) && (!t || `${s.name} ${s.owner} ${s.city}`.toLowerCase().includes(t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellers, f.q, f.tab, st]);
  const n = (k: string) => sellers.filter((s) => k === "all" || eff(s) === k).length;

  return (
    <>
      <ListToolbar {...f} placeholder="Search seller, owner or city" tabs={[{ value: "all", label: "All", count: n("all") }, { value: "active", label: "Active", count: n("active") }, { value: "pending", label: "Pending approval", count: n("pending") }, { value: "suspended", label: "Suspended", count: n("suspended") }, { value: "rejected", label: "Rejected", count: n("rejected") }]} />
      <DataTable rows={rows} rowKey={(s) => s.id} rowHref={(s) => `/admin/sellers/${s.id}`} empty={<EmptyState icon={<Store />} title="No sellers here" />}
        columns={[
          { key: "n", header: "Seller", mobile: "title", cell: (s) => <span className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold text-white" style={{ background: s.tone[1] }}>{s.name[0]}</span><span className="min-w-0"><span className="block truncate font-medium">{s.name}</span><span className="block truncate text-xs text-muted">{s.owner} · {s.city}</span></span></span> },
          { key: "st", header: "Status", mobile: "right", cell: (s) => <StatusBadge status={eff(s)} /> },
          { key: "r", header: "Rating", mobile: "row", cell: (s) => s.rating ? <Rating value={s.rating} size="sm" /> : <span className="text-subtle">—</span> },
          { key: "p", header: "Products", align: "right", mobile: "row", cell: (s) => <span className="tabular">{s.productCount}</span> },
          { key: "sa", header: "Lifetime sales", align: "right", mobile: "row", cell: (s) => <span className="tabular font-medium">{formatCompactINR(s.totalSales)}</span> },
          { key: "k", header: "KYC", mobile: "row", cell: (s) => <StatusBadge status={s.kyc} /> },
          { key: "j", header: "Joined", mobile: "hide", cell: (s) => <span className="text-muted">{formatDate(s.joined, { day: "numeric", month: "short", year: "2-digit" })}</span> },
        ]} actions={(s) => eff(s) === "pending" ? (
          <>
            <Button size="sm" onClick={() => decide(s, "active")}><Check className="size-3.5" /> Approve</Button>
            <Button size="sm" variant="outline" onClick={() => decide(s, "rejected")}><X className="size-3.5" /> Reject</Button>
          </>) : null} />
    </>
  );
}
