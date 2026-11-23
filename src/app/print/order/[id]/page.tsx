import { notFound } from "next/navigation";
import { PrintButton } from "@/components/shared/print-button";
import { getOrderByIdOrNumber } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Print order", robots: { index: false, follow: false } };

const PAY: Record<string, string> = { cod: "Cash on delivery", upi: "UPI", card: "Card", netbanking: "Net banking", wallet: "Wallet" };

/**
 * Printable invoice (?type=invoice, default) or packing slip (?type=slip) for one order.
 * Access follows the database rules (RLS): customers see their own orders, sellers theirs, admins all — anyone else gets a 404.
 */
export default async function PrintOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string; auto?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const o = await getOrderByIdOrNumber(id);
  if (!o) notFound();
  const slip = sp.type === "slip";
  const a = o.address;
  const wallet = o.walletUsed ?? 0;
  const other = Math.max(0, o.total + wallet - (o.subtotal - o.discount + o.shipping));
  const qty = o.items.reduce((n, i) => n + i.qty, 0);

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-[13px] leading-relaxed text-black print:max-w-none print:p-0 md:p-10">
      <style>{`@page { size: A4; margin: 14mm; } @media print { html, body { background: #fff !important; } }`}</style>
      <div className="mb-6 flex items-center justify-between print:hidden"><PrintButton auto={sp.auto === "1"} /><span className="text-xs text-neutral-500">Tip: choose “Save as PDF” as the printer to download.</span></div>

      <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
        <div>
          <p className="text-2xl font-black tracking-tight">{process.env.BUSINESS_NAME?.trim() || "ManaBrand"}</p>
          <p className="mt-1 text-neutral-600">Ichapuram, Srikakulam, Andhra Pradesh 532312<br />care@manabrand.in · +91 831 765 8309{process.env.BUSINESS_GSTIN?.trim() && !slip ? <><br />GSTIN: <b>{process.env.BUSINESS_GSTIN?.trim()}</b></> : null}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold uppercase tracking-wide">{slip ? "Packing slip" : process.env.BUSINESS_GSTIN?.trim() ? "Tax invoice" : "Invoice"}</p>
          <p className="mt-1">Order <b>{o.number}</b></p>
          <p className="text-neutral-600">{formatDate(o.createdAt)}</p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{slip ? "Deliver to" : "Billed & shipped to"}</p>
          <p className="mt-1 font-semibold">{a.name || o.customerName}</p>
          <p>{[a.line1, a.line2].filter(Boolean).join(", ")}<br />{[a.city, a.state].filter(Boolean).join(", ")} {a.pincode}<br />Phone: {a.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">{slip ? "Delivery" : "Payment"}</p>
          {slip
            ? <p className="mt-1">{o.courier ?? "ManaBrand Delivery"}{o.awb ? <><br />Tracking: <b>{o.awb}</b></> : null}</p>
            : <p className="mt-1">{PAY[o.payment.method] ?? o.payment.method}<br />Status: <b className="capitalize">{o.payment.status}</b></p>}
        </div>
      </section>

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left text-[11px] uppercase tracking-wider">
            {slip && <th className="w-8 py-2" />}
            <th className="py-2">Item</th><th className="py-2">Size / colour</th><th className="py-2 text-right">Qty</th>
            {!slip && <><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Amount</th></>}
          </tr>
        </thead>
        <tbody>
          {o.items.map((i, n) => (
            <tr key={`${i.productId}-${n}`} className="border-b border-neutral-300 align-top">
              {slip && <td className="py-2.5"><span className="inline-block size-4 border border-black" /></td>}
              <td className="py-2.5 pr-3 font-medium">{i.name}</td>
              <td className="py-2.5 pr-3">{[i.size, i.color].filter(Boolean).join(" · ")}</td>
              <td className="py-2.5 text-right tabular-nums">{i.qty}</td>
              {!slip && <><td className="py-2.5 text-right tabular-nums">{formatINR(i.price)}</td><td className="py-2.5 text-right tabular-nums">{formatINR(i.price * i.qty)}</td></>}
            </tr>
          ))}
        </tbody>
      </table>

      {slip ? (
        <p className="mt-4 text-right font-semibold">Total items: {qty}</p>
      ) : (
        <dl className="ml-auto mt-4 w-64 space-y-1">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatINR(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between"><dt>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</dt><dd className="tabular-nums">− {formatINR(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{o.shipping ? formatINR(o.shipping) : "Free"}</dd></div>
          {other > 0 && <div className="flex justify-between"><dt>Other charges</dt><dd className="tabular-nums">{formatINR(other)}</dd></div>}
          {wallet > 0 && <div className="flex justify-between"><dt>Wallet credit</dt><dd className="tabular">− {formatINR(wallet)}</dd></div>}
          <div className="flex justify-between border-t-2 border-black pt-1.5 text-base font-extrabold"><dt>Total</dt><dd className="tabular-nums">{formatINR(o.total)}</dd></div>
        </dl>
      )}

      <footer className="mt-10 border-t border-neutral-300 pt-3 text-center text-[11px] text-neutral-500">
        {slip ? "Please pack with care and attach this slip to the parcel." : "Thank you for shopping local with ManaBrand. Prices include applicable taxes. This is a computer-generated document."}
      </footer>
    </div>
  );
}
