"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import { Tabs } from "@/components/ui/tabs";
import { decideReturn } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { formatDate, formatINR } from "@/lib/utils";
import type { ReturnRequest } from "@/types";

export function ReturnsView({ returns }: { returns: ReturnRequest[] }) {
  const [list, setList] = useState(returns);
  const { act } = useAct();
  const [tab, setTab] = useState("all");
  const rows = useMemo(() => list.filter((r) => tab === "all" || r.status === tab), [list, tab]);
  const set = (id: string, status: ReturnRequest["status"], msg: string) =>
    act(() => decideReturn(id, status as "approved" | "rejected" | "picked_up" | "refunded"), { success: msg, refresh: false, onOk: () => setList((l) => l.map((r) => (r.id === id ? { ...r, status } : r))) });
  const n = (s: string) => list.filter((r) => s === "all" || r.status === s).length;

  return (
    <>
      <Tabs variant="pill" size="sm" className="mb-4" value={tab} onChange={setTab} items={[{ value: "all", label: "All", count: n("all") }, { value: "requested", label: "Requested", count: n("requested") }, { value: "approved", label: "Approved", count: n("approved") }, { value: "picked_up", label: "Picked up", count: n("picked_up") }, { value: "refunded", label: "Completed", count: n("refunded") }, { value: "rejected", label: "Rejected", count: n("rejected") }]} />
      <DataTable rows={rows} rowKey={(r) => r.id} empty={<EmptyState icon={<RotateCcw />} title="No exchange requests" />} columns={[
        { key: "o", header: "Order", mobile: "title", cell: (r) => <span><span className="font-semibold">{r.orderNumber}</span> <span className="text-muted">· exchange</span></span> },
        { key: "i", header: "Item", mobile: "sub", cell: (r) => <span className="text-muted">{r.item}</span> },
        { key: "s", header: "Status", mobile: "right", cell: (r) => <StatusBadge status={r.status === "refunded" ? "exchanged" : r.status} /> },
        { key: "c", header: "Customer", mobile: "row", cell: (r) => r.customerName },
        { key: "r", header: "Reason", mobile: "row", cell: (r) => <span className="text-muted">{r.reason}</span> },
        { key: "a", header: "Amount", align: "right", mobile: "row", cell: (r) => <span className="tabular font-medium">{formatINR(r.amount)}</span> },
        { key: "d", header: "Requested", mobile: "hide", cell: (r) => <span className="text-muted">{formatDate(r.createdAt, { day: "numeric", month: "short" })}</span> },
      ]} actions={(r) => r.status === "requested" ? <><Button size="sm" onClick={() => set(r.id, "approved", `Exchange for ${r.orderNumber} approved — pickup scheduled`)}><Check className="size-3.5" /> Approve</Button><Button size="sm" variant="outline" onClick={() => set(r.id, "rejected", "Request rejected")}><X className="size-3.5" /> Reject</Button></>
        : r.status === "approved" ? <Button size="sm" variant="outline" onClick={() => set(r.id, "picked_up", "Marked as picked up")}>Mark picked up</Button>
        : r.status === "picked_up" ? <Button size="sm" variant="outline" onClick={() => set(r.id, "refunded", "Exchange completed")}>Complete exchange</Button> : null} />
    </>
  );
}
