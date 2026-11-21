import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { refundPayment } from "./razorpay";

/**
 * Refund an online-paid order through Razorpay and mark it refunded. Returns { refunded: false } (not an error) for
 * orders that were never paid online — cash on delivery, or payment still pending.
 */
export async function refundOrderIfPaid(orderId: string): Promise<{ ok: boolean; refunded: boolean; error?: string }> {
  const db = createAdminClient();
  const { data: o } = await db.from("orders").select("id, status, payment_method, payment_ref, total").eq("id", orderId).maybeSingle();
  const order = o as { id: string; status: string; payment_method: string; payment_ref: string | null; total: number } | null;
  if (!order || order.payment_method === "cod" || !order.payment_ref?.startsWith("pay_")) return { ok: true, refunded: false };
  const r = await refundPayment(order.payment_ref, order.total);
  // Razorpay answers "already fully refunded" if this ran twice — treat that as success
  if (!r.ok && !/already.*refund/i.test(r.error)) return { ok: false, refunded: false, error: r.error };
  await db.from("orders").update({ payment_status: "refunded" }).eq("id", orderId);
  await db.from("order_events").insert({ order_id: orderId, status: order.status, note: `Refund of ₹${order.total} sent to the original payment method` });
  return { ok: true, refunded: true };
}
