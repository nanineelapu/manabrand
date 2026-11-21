"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard, MapPin, MessageCircle, Printer, Truck, User } from "lucide-react";
import { orderUpdateLink } from "@/lib/whatsapp";
import { OrderTimeline, Panel } from "@/components/shared/blocks";
import { StatusBadge } from "@/components/shared/status";
import { ProductImage } from "@/components/brand/product-image";
import { Avatar, DetailRow } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { addOrderNote, refundOrderPayment, setOrderStatus } from "@/lib/actions/manage";
import { cancelOrder } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const next: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  placed: { to: "confirmed", label: "Confirm order" }, confirmed: { to: "packed", label: "Mark as packed" },
  packed: { to: "shipped", label: "Mark as shipped" }, shipped: { to: "out_for_delivery", label: "Out for delivery" }, out_for_delivery: { to: "delivered", label: "Mark delivered" },
};
const methodLabel = { upi: "UPI", card: "Card", cod: "Cash on delivery", netbanking: "Net banking", wallet: "Wallet" };

/** Shared by admin and seller order screens. */
export function OrderManager({ order, base, role }: { order: Order; base: string; role: "admin" | "seller" }) {
  const [o, setO] = useState(order);
  const [note, setNote] = useState("");
  const { act } = useAct();
  const [force, setForce] = useState<OrderStatus | "">("");
  const step = next[o.status];

  const applyLocal = (to: OrderStatus, msg: string) => {
    setO((p) => ({
      ...p, status: to,
      timeline: [...p.timeline, { status: to, at: new Date().toISOString(), note: msg || `Updated by ${role}` }],
      awb: to === "shipped" && !p.awb ? `${Math.floor(1e9 + Math.random() * 8e9)}` : p.awb, courier: to === "shipped" && !p.courier ? "ManaBrand Local Delivery" : p.courier,
    }));
  };
  const advance = (to: OrderStatus, msg = "") =>
    act(() => (to === "cancelled" ? cancelOrder(o.id, msg) : setOrderStatus(o.id, to, msg)),
      { success: `Order ${o.number} → ${to.replace(/_/g, " ")}`, onOk: () => applyLocal(to, msg), onDemo: () => applyLocal(to, msg) });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5 rounded-card border border-line bg-card p-4 shadow-card md:p-5">
        <div className="mr-auto"><div className="flex items-center gap-2.5"><h2 className="text-xl font-semibold">{o.number}</h2><StatusBadge status={o.status} /></div><p className="mt-0.5 text-[13px] text-muted">Placed {formatDateTime(o.createdAt)} · {o.items.length} line{o.items.length > 1 ? "s" : ""}</p></div>
        {role === "admin" && <Button variant="outline" size="sm" href={`/print/order/${o.id}?type=invoice`} target="_blank"><Printer className="size-4" /> Invoice</Button>}
        <Button variant="outline" size="sm" href={`/print/order/${o.id}?type=slip`} target="_blank"><Printer className="size-4" /> Packing slip</Button>
        {role === "admin" && <Button variant="outline" size="sm" href={orderUpdateLink({ phone: o.address.phone, name: o.customerName, number: o.number, status: o.status, awb: o.awb, courier: o.courier })} target="_blank"><MessageCircle className="size-4" /> WhatsApp customer</Button>}
        {role === "admin" && o.payment.status === "paid" && o.payment.method !== "cod" && <Button variant="outline" size="sm" className="text-danger" onClick={() => { if (window.confirm(`Refund ${formatINR(o.total)} to the customer for ${o.number}?`)) act(() => refundOrderPayment(o.id), { success: "Refund sent to the customer", refresh: true }); }}>Refund payment</Button>}
        {step && <Button size="sm" variant="accent" onClick={() => advance(step.to)}>{step.label}</Button>}
        {["placed", "confirmed"].includes(o.status) && <Button size="sm" variant="outline" className="text-danger" onClick={() => advance("cancelled", "Cancelled by " + role)}>Cancel</Button>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel title={`Items (${o.items.reduce((a, b) => a + b.qty, 0)})`} padded={false}>
            <ul className="divide-y divide-line">
              {o.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3.5 p-4 md:px-5">
                  <span className="aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg"><ProductImage photo={it.photo} seed={it.productId} color={it.colorHex} src={it.image} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{it.name}</p><p className="text-xs text-muted">{it.color} · Size {it.size} · ×{it.qty}</p></div>
                  <p className="text-sm font-semibold tabular">{formatINR(it.price * it.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="divide-y divide-line border-t border-line px-4 md:px-5">
              <DetailRow label="Subtotal"><span className="tabular">{formatINR(o.subtotal)}</span></DetailRow>
              {o.discount > 0 && <DetailRow label={`Discount ${o.couponCode ?? ""}`}><span className="tabular text-success">− {formatINR(o.discount)}</span></DetailRow>}
              <DetailRow label="Shipping"><span className="tabular">{o.shipping ? formatINR(o.shipping) : "Free"}</span></DetailRow>
              <DetailRow label="Total"><span className="text-base font-semibold tabular">{formatINR(o.total)}</span></DetailRow>
            </dl>
          </Panel>

          <Panel title="Fulfilment">
            {o.awb ? <p className="mb-4 flex items-center gap-2 rounded-ctl bg-bg-subtle px-3.5 py-3 text-sm"><Truck className="size-4 text-accent" /><span><b>{o.courier}</b> · AWB {o.awb}</span></p> : <p className="mb-4 text-sm text-muted">Shipment details appear after the order is marked shipped.</p>}
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Update status manually" htmlFor="fs"><Select id="fs" value={force} onChange={(e) => setForce(e.target.value as OrderStatus)}><option value="">Choose status…</option>{(["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"] as OrderStatus[]).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</Select></Field>
              <Button variant="outline" disabled={!force} onClick={() => { advance(force as OrderStatus, "Manual update"); setForce(""); }}>Apply</Button>
            </div>
            <Field label="Internal note" htmlFor="nt" className="mt-4" hint="Only visible to staff."><Textarea id="nt" value={note} onChange={(e) => setNote(e.target.value)} rows={3} /></Field>
            <Button size="sm" variant="secondary" className="mt-3" disabled={!note.trim()} onClick={() => act(() => addOrderNote(o.id, note), { success: "Note saved", onOk: () => setNote(""), refresh: false })}>Save note</Button>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Timeline"><OrderTimeline events={o.timeline} status={o.status} /></Panel>
          <Panel title="Customer">
            <div className="flex items-center gap-3"><Avatar name={o.customerName} size={42} /><div className="min-w-0"><Link href={`/admin/customers/${o.customerId}`} className={role === "admin" ? "text-sm font-semibold hover:underline" : "pointer-events-none text-sm font-semibold"}>{o.customerName}</Link><p className="text-xs text-muted">{o.address.phone}</p></div></div>
            <p className="mt-4 flex gap-2 text-[13px] leading-relaxed text-muted"><MapPin className="mt-0.5 size-4 shrink-0" />{o.address.line1}, {o.address.city}, {o.address.state} – {o.address.pincode}</p>
          </Panel>
          <Panel title="Payment"><dl className="-my-2.5 divide-y divide-line"><DetailRow label="Method"><span className="inline-flex items-center gap-1.5"><CreditCard className="size-4 text-muted" />{methodLabel[o.payment.method]}</span></DetailRow><DetailRow label="Status"><StatusBadge status={o.payment.status} /></DetailRow>{role === "admin" && <DetailRow label="Customer"><User className="inline size-4 text-muted" /> {o.customerId.toUpperCase()}</DetailRow>}</dl></Panel>
        </div>
      </div>
      <Link href={`${base}/orders`} className="inline-block text-sm text-muted hover:text-fg">← Back to orders</Link>
    </div>
  );
}
