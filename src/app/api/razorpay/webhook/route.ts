import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";

export const dynamic = "force-dynamic";

/**
 * Razorpay → ManaBrand. Marks an order paid even if the customer closed the browser right after paying.
 * Set up in Razorpay: Settings → Webhooks → URL https://<your-domain>/api/razorpay/webhook, events
 * payment.captured, order.paid, refund.processed, and the same secret as RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) return Response.json({ error: "Webhook not configured" }, { status: 503 });
  if (!verifyWebhookSignature(raw, sig)) return Response.json({ error: "Bad signature" }, { status: 400 });

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } }; refund?: { entity?: { payment_id?: string } } } };
  try { event = JSON.parse(raw); } catch { return Response.json({ error: "Bad body" }, { status: 400 }); }

  const db = createAdminClient();
  const pay = event.payload?.payment?.entity;
  if ((event.event === "payment.captured" || event.event === "order.paid") && pay?.id && pay.order_id) {
    // the order we created stored the Razorpay order id in payment_ref until the payment arrives
    const { data: o } = await db.from("orders").select("id").eq("payment_ref", pay.order_id).maybeSingle();
    if (o) await db.rpc("confirm_payment", { p_order: (o as { id: string }).id, p_ref: pay.id });
  } else if (event.event === "refund.processed") {
    const paymentId = event.payload?.refund?.entity?.payment_id;
    if (paymentId) await db.from("orders").update({ payment_status: "refunded" }).eq("payment_ref", paymentId);
  }
  return Response.json({ ok: true });
}
