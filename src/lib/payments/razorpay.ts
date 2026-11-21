import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay (UPI, cards, net banking, wallets, refunds). Environment variables:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   — Razorpay dashboard → Account & Settings → API keys
 *   RAZORPAY_WEBHOOK_SECRET                  — the secret you type when creating the webhook (see docs/PAYMENTS_SETUP.md)
 *   PAYMENT_MODE=live                        — switches online payment on in checkout
 * Without them the site stays cash-on-delivery only.
 */
const API = "https://api.razorpay.com/v1";

export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
/** Online payment is available only when it has been switched on AND the keys are present. */
export const onlinePaymentsLive = () => process.env.PAYMENT_MODE === "live" && razorpayConfigured();

const basic = () => "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

async function post<T>(path: string, body: Record<string, unknown>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API}${path}`, { method: "POST", headers: { Authorization: basic(), "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    const json = (await res.json().catch(() => ({}))) as { error?: { description?: string } };
    if (!res.ok) { console.error(`[razorpay] ${path} ${res.status}: ${json.error?.description ?? ""}`); return { ok: false, error: json.error?.description ?? "Payment provider error" }; }
    return { ok: true, data: json as T };
  } catch (e) {
    console.error("[razorpay] request failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Could not reach the payment provider" };
  }
}

/** Create the Razorpay order that the checkout window pays against. Amounts are in paise. */
export async function createRzpOrder(o: { amountInr: number; receipt: string; notes?: Record<string, string> }) {
  return post<{ id: string; amount: number }>("/orders", { amount: Math.round(o.amountInr * 100), currency: "INR", receipt: o.receipt, notes: o.notes });
}

/** Refund a captured payment (whole amount unless `amountInr` is given). */
export async function refundPayment(paymentId: string, amountInr?: number) {
  return post<{ id: string }>(`/payments/${encodeURIComponent(paymentId)}/refund`, amountInr ? { amount: Math.round(amountInr * 100) } : {});
}

const safeEqual = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

/** The signature Razorpay returns to the browser after a successful payment. */
export function verifyCheckoutSignature(rzpOrderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${rzpOrderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** The X-Razorpay-Signature header on webhook calls (HMAC of the raw body with the webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEqual(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}
