import Link from "next/link";
import { PayNowButton } from "@/components/store/pay-now-button";
import { MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askAboutOrder } from "@/lib/whatsapp";
import { CreditCard, MapPin, Truck } from "lucide-react";
import { OrderTimeline } from "@/components/shared/blocks";
import { StatusBadge } from "@/components/shared/status";
import { ProductImage } from "@/components/brand/product-image";
import { DetailRow } from "@/components/ui/display";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";
import { getProductsByIds } from "@/lib/data";
import type { Order } from "@/types";
import { OrderActions } from "./order-actions";

const payLabel = { upi: "UPI", card: "Credit/Debit card", cod: "Cash on delivery", netbanking: "Net banking", wallet: "Wallet" };

export async function OrderDetail({ order: o }: { order: Order }) {
  const slugs = new Map((await getProductsByIds([...new Set(o.items.map((i) => i.productId))])).map((p) => [p.id, p.slug]));
  const eta = o.timeline.at(-1);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm text-muted">Order</p><h2 className="font-display text-2xl font-semibold md:text-3xl">{o.number}</h2><p className="text-[13px] text-muted">Placed on {formatDateTime(o.createdAt)}</p></div>
        <StatusBadge status={o.status} className="text-[13px]" />
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button href={`/print/order/${o.id}?type=invoice`} target="_blank" size="sm" variant="outline"><Printer className="size-4" /> Invoice</Button>
        {o.payment.status === "pending" && o.payment.method !== "cod" && o.status !== "cancelled" && <PayNowButton orderId={o.id} />}
        <Button href={askAboutOrder(o.number)} target="_blank" size="sm" variant="outline"><MessageCircle className="size-4" /> Ask about this order on WhatsApp</Button>
      </div>
      <OrderActions orderId={o.id} number={o.number} status={o.status} items={o.items.map((i) => ({ itemId: i.itemId, name: i.name }))} />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="rounded-card border border-line bg-card p-5 shadow-card">
            <h3 className="mb-5 text-[15px] font-semibold">Tracking</h3>
            {o.awb && <p className="mb-5 flex items-center gap-2 rounded-ctl bg-bg-subtle px-3.5 py-3 text-[13px]"><Truck className="size-4 text-accent" /><span><b>{o.courier}</b> · Tracking no. {o.awb}</span></p>}
            <OrderTimeline events={o.timeline} status={o.status} />
            {eta && o.status !== "delivered" && o.status !== "cancelled" && o.status !== "returned" && <p className="mt-5 text-xs text-muted">Expected by {formatDate(new Date(+new Date(o.createdAt) + 2 * 86400000).toISOString(), { weekday: "short", day: "numeric", month: "short" })}</p>}
          </section>

          <section className="rounded-card border border-line bg-card shadow-card">
            <h3 className="border-b border-line px-5 py-4 text-[15px] font-semibold">Items ({o.items.reduce((a, b) => a + b.qty, 0)})</h3>
            <ul className="divide-y divide-line">
              {o.items.map((it, i) => (
                <li key={i} className="flex gap-4 p-5">
                  <span className="aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl"><ProductImage photo={it.photo} seed={it.productId} color={it.colorHex} src={it.image} /></span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${slugs.get(it.productId) ?? ""}`} className="line-clamp-2 text-[15px] font-medium leading-snug hover:underline">{it.name}</Link>
                    <p className="mt-1 text-[13px] text-muted">{it.color} · Size {it.size} · Qty {it.qty}</p>
                    <p className="mt-2 text-sm font-semibold tabular">{formatINR(it.price * it.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-card border border-line bg-card p-5 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold"><MapPin className="size-4 text-accent" /> Delivery address</h3>
            <p className="text-sm font-medium">{o.address.name}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{o.address.line1}, {o.address.city}, {o.address.state} – {o.address.pincode}</p>
            <p className="mt-1 text-[13px] text-muted">{o.address.phone}</p>
          </section>
          <section className="rounded-card border border-line bg-card p-5 shadow-card">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-semibold"><CreditCard className="size-4 text-accent" /> Payment summary</h3>
            <dl className="divide-y divide-line">
              <DetailRow label="Subtotal"><span className="tabular">{formatINR(o.subtotal)}</span></DetailRow>
              {o.discount > 0 && <DetailRow label={`Coupon ${o.couponCode ?? ""}`}><span className="tabular text-success">− {formatINR(o.discount)}</span></DetailRow>}
              <DetailRow label="Shipping"><span className="tabular">{o.shipping ? formatINR(o.shipping) : "Free"}</span></DetailRow>
              {(o.walletUsed ?? 0) > 0 && <DetailRow label="Wallet credit"><span className="tabular text-success">− {formatINR(o.walletUsed ?? 0)}</span></DetailRow>}
              <DetailRow label="Total paid"><span className="text-base font-semibold tabular">{formatINR(o.total)}</span></DetailRow>
              <DetailRow label="Method">{payLabel[o.payment.method]}</DetailRow>
              <DetailRow label="Status"><StatusBadge status={o.payment.status} /></DetailRow>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
