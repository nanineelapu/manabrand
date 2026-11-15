"use client";

import { useState } from "react";
import { BadgeCheck, Check, FileCheck2, KeyRound, Mail, MapPin, Percent, Phone, ShieldAlert, X } from "lucide-react";
import { Panel, StatCard } from "@/components/shared/blocks";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { DetailRow } from "@/components/ui/display";
import { Field, Input, Switch } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { setSellerCommission, setSellerPermissions, setSellerStatus } from "@/lib/actions/manage";
import { PERMISSION_DEFS } from "@/lib/permissions";
import { useAct } from "@/lib/actions/use-act";
import { toast } from "@/lib/stores";
import { formatCompactINR, formatDate, formatNumber } from "@/lib/utils";
import type { Seller, SellerPermissions, SellerStatus } from "@/types";

export function SellerDetail({ seller, children }: { seller: Seller; children?: React.ReactNode }) {
  const [status, setStatus] = useState<SellerStatus>(seller.status);
  const [kyc, setKyc] = useState(seller.kyc);
  const [commission, setCommission] = useState(String(seller.commissionPct));
  const [confirm, setConfirm] = useState<null | "suspend" | "reject">(null);
  const [perms, setPerms] = useState<SellerPermissions>(seller.permissions);
  const [savedPerms, setSavedPerms] = useState<SellerPermissions>(seller.permissions);
  const permsDirty = PERMISSION_DEFS.some((d) => perms[d.key] !== savedPerms[d.key]);
  const { act: run } = useAct();

  const act = (to: SellerStatus, msg: string) =>
    run(() => setSellerStatus(seller.id, to as "active" | "suspended" | "rejected"), { success: msg, onOk: () => { setStatus(to); if (to === "active") setKyc("verified"); setConfirm(null); } });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-card p-4 shadow-card md:p-5">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl font-display text-3xl font-semibold text-white" style={{ background: seller.tone[1] }}>{seller.name[0]}</span>
        <div className="mr-auto min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{seller.name}</h2><StatusBadge status={status} />{kyc === "verified" && <BadgeCheck className="size-5 text-info" aria-label="KYC verified" />}</div>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{seller.city}, {seller.state}</span><span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{seller.email}</span><span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{seller.phone}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "pending" && <><Button onClick={() => act("active", `${seller.name} approved`)}><Check className="size-4" /> Approve seller</Button><Button variant="outline" className="text-danger" onClick={() => setConfirm("reject")}><X className="size-4" /> Reject</Button></>}
          {status === "active" && <Button variant="outline" className="text-danger" onClick={() => setConfirm("suspend")}><ShieldAlert className="size-4" /> Suspend</Button>}
          {(status === "suspended" || status === "rejected") && <Button onClick={() => act("active", `${seller.name} reactivated`)}>Reactivate</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Lifetime sales" value={formatCompactINR(seller.totalSales)} hint="Gross merchandise value" />
        <StatCard label="Products" value={String(seller.productCount)} hint="Listed" />
        <StatCard label="Followers" value={formatNumber(seller.followers)} hint="Storefront follows" />
        <StatCard label="Rating" value={seller.rating ? seller.rating.toFixed(1) : "—"} hint="Across all reviews" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Business details"><dl className="-my-2.5 divide-y divide-line">
          <DetailRow label="Owner">{seller.owner}</DetailRow><DetailRow label="GSTIN"><span className="font-mono text-[13px]">{seller.gstin}</span></DetailRow>
          <DetailRow label="Joined">{formatDate(seller.joined)}</DetailRow><DetailRow label="About"><span className="block max-w-xs text-left font-normal text-muted">{seller.blurb}</span></DetailRow>
        </dl></Panel>
        <Panel title="KYC & compliance" action={<StatusBadge status={kyc} />}>
          <ul className="space-y-2.5">
            {["PAN card", "GST certificate", "Cancelled cheque", "Address proof"].map((d, i) => (
              <li key={d} className="flex items-center gap-3 rounded-ctl bg-bg px-3.5 py-3 text-sm"><FileCheck2 className={`size-[18px] ${kyc === "verified" || i < 2 ? "text-success" : "text-warning"}`} /><span className="flex-1">{d}</span><button className="text-xs font-medium underline" onClick={() => toast.info(`${d} preview opened (demo)`)}>View</button></li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Seller access" action={<KeyRound className="size-4 text-muted" />}>
        <p className="mb-3 text-sm text-muted">Choose what {seller.name} can do in their seller dashboard. You always have full access to everything; sellers only get what you switch on here.{status !== "active" && " These take effect once the store is approved."}</p>
        <ul className="divide-y divide-line">
          {PERMISSION_DEFS.map((d) => (
            <li key={d.key} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0"><p className="text-sm font-medium">{d.label}</p><p className="text-xs text-muted">{d.desc}</p></div>
              <Switch label={d.label} checked={perms[d.key]} onChange={(v) => setPerms((p) => ({ ...p, [d.key]: v }))} />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-3">
          <Button disabled={!permsDirty} onClick={() => run(() => setSellerPermissions(seller.id, perms), { success: "Seller access updated", refresh: false, onOk: () => setSavedPerms(perms) })}>Save access</Button>
          {permsDirty && <button type="button" onClick={() => setPerms(savedPerms)} className="text-sm font-medium text-muted underline underline-offset-4">Undo changes</button>}
        </div>
      </Panel>

      <Panel title="Commission" action={<Percent className="size-4 text-muted" />}>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); const n = Number(commission); if (!(n >= 0 && n <= 40)) { toast.error("Enter a rate between 0 and 40%"); return; } run(() => setSellerCommission(seller.id, n), { success: `Commission set to ${n}% for ${seller.name}`, refresh: false }); }}>
          <Field label="Marketplace fee (%)" htmlFor="cm" className="w-40"><Input id="cm" inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} /></Field>
          <Button type="submit" variant="outline">Update</Button>
          <p className="basis-full text-xs text-muted">Applies to all new orders. Default platform rate is 12%.</p>
        </form>
      </Panel>

      {children}

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} side="dialog" title={confirm === "suspend" ? `Suspend ${seller.name}?` : `Reject ${seller.name}?`}
        description={confirm === "suspend" ? "Their products are hidden and payouts paused until reactivated." : "They’ll be notified and can reapply with corrected documents."}
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => act(confirm === "suspend" ? "suspended" : "rejected", confirm === "suspend" ? "Seller suspended" : "Application rejected")}>{confirm === "suspend" ? "Suspend" : "Reject"}</Button></div>}><span /></Sheet>
    </div>
  );
}
