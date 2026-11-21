"use client";

import { downloadCsv } from "@/lib/csv";
import { useMemo, useState } from "react";
import { Banknote, Download, Landmark } from "lucide-react";
import { StatCard } from "@/components/shared/blocks";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { generatePayouts, setPayoutStatus } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { toast } from "@/lib/stores";
import { formatCompactINR, formatDate, formatINR } from "@/lib/utils";
import type { Payout } from "@/types";

/** Shared payouts table. role=admin can release/hold; role=seller is read-only with statements. */
export function PayoutsView({ payouts, role }: { payouts: Payout[]; role: "admin" | "seller" }) {
  const [list, setList] = useState(payouts);
  const { act, busy } = useAct();
  const [tab, setTab] = useState("all");
  const rows = useMemo(() => list.filter((p) => tab === "all" || p.status === tab), [list, tab]);
  const sum = (s: Payout["status"][]) => list.filter((p) => s.includes(p.status)).reduce((a, b) => a + b.net, 0);
  const set = (id: string, status: Payout["status"], msg: string) =>
    act(() => setPayoutStatus(id, status), { success: msg, refresh: false,
      onOk: (r) => setList((l) => l.map((p) => (p.id === id ? { ...p, status, utr: status === "paid" ? ((r as { utr?: string }).utr ?? p.utr) : p.utr } : p))),
      onDemo: () => setList((l) => l.map((p) => (p.id === id ? { ...p, status, utr: status === "paid" ? `HDFCR5${Math.floor(1e9 + Math.random() * 8e9)}` : p.utr } : p))) });
  // previous half-month cycle: 1–15 or 16–end
  const cycle = () => {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth(), iso = (d: Date) => d.toISOString().slice(0, 10);
    return now.getDate() > 15 ? { start: iso(new Date(Date.UTC(y, m, 1))), end: iso(new Date(Date.UTC(y, m, 15))) } : { start: iso(new Date(Date.UTC(y, m - 1, 16))), end: iso(new Date(Date.UTC(y, m, 0))) };
  };
  const generate = () => { const c = cycle(); return act(() => generatePayouts(c.start, c.end), { success: "Payouts generated", onDemo: () => toast.info("Payouts are generated from real delivered orders once Supabase is connected") }); };

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Paid out (all time)" value={formatCompactINR(sum(["paid"]))} icon={<Banknote />} hint="Settled to bank" />
        <StatCard label="Processing" value={formatCompactINR(sum(["processing"]))} icon={<Landmark />} hint="In transit, 1–2 days" />
        <StatCard label="Scheduled" value={formatCompactINR(sum(["scheduled"]))} hint="Next cycle" tone="accent" />
        <StatCard label="On hold" value={formatCompactINR(sum(["on_hold"]))} hint="Needs attention" />
      </div>
      {role === "admin" && <div className="mb-4 flex justify-end"><Button variant="outline" size="sm" loading={busy} onClick={generate}>Generate payouts for last cycle</Button></div>}
      <Tabs variant="pill" size="sm" className="mb-4" value={tab} onChange={setTab} items={[{ value: "all", label: "All" }, { value: "scheduled", label: "Scheduled" }, { value: "processing", label: "Processing" }, { value: "paid", label: "Paid" }, { value: "on_hold", label: "On hold" }]} />
      <DataTable rows={rows} rowKey={(p) => p.id} columns={[
        { key: "s", header: role === "admin" ? "Seller" : "Period", mobile: "title", cell: (p) => role === "admin" ? <span className="font-medium">{p.sellerName}</span> : <span className="font-medium">{p.period}</span> },
        { key: "pe", header: "Period", mobile: "sub", cell: (p) => <span className="text-muted">{role === "admin" ? p.period : `${p.orders} orders`}</span>, className: role === "admin" ? "" : "hidden" },
        { key: "st", header: "Status", mobile: "right", cell: (p) => <StatusBadge status={p.status} /> },
        { key: "o", header: "Orders", align: "right", mobile: "row", cell: (p) => <span className="tabular">{p.orders}</span> },
        { key: "g", header: "Gross", align: "right", mobile: "row", cell: (p) => <span className="tabular">{formatINR(p.gross)}</span> },
        { key: "c", header: "Fee", align: "right", mobile: "row", cell: (p) => <span className="tabular text-muted">− {formatINR(p.commission)}</span> },
        { key: "n", header: "Net payout", align: "right", mobile: "row", cell: (p) => <span className="tabular font-semibold">{formatINR(p.net)}</span> },
        { key: "d", header: "Date", mobile: "hide", cell: (p) => <span className="text-muted">{formatDate(p.date, { day: "numeric", month: "short" })}</span> },
      ]} actions={(p) => role === "admin" ? (
        p.status === "scheduled" ? <Button size="sm" onClick={() => set(p.id, "processing", `Payout to ${p.sellerName} released`)}>Release payout</Button>
        : p.status === "on_hold" ? <Button size="sm" variant="outline" onClick={() => set(p.id, "scheduled", "Hold removed")}>Remove hold</Button>
        : p.status === "processing" ? <Button size="sm" variant="outline" onClick={() => set(p.id, "paid", "Marked as paid")}>Mark paid</Button> : <span className="font-mono text-[11px] text-subtle">{p.utr}</span>
      ) : <Button size="sm" variant="ghost" onClick={() => downloadCsv(`payout-${p.period.replace(/[^a-z0-9]+/gi, "-")}`, [["Seller", "Period", "Orders", "Gross (INR)", "Fee (INR)", "Net payout (INR)", "Status", "Date", "UTR"], [p.sellerName, p.period, p.orders, p.gross, p.commission, p.net, p.status, p.date.slice(0, 10), p.utr ?? ""]])}><Download className="size-3.5" /> Statement</Button>} />
    </>
  );
}
