"use client";

import { confirmPayment, startPayment } from "@/lib/actions/store";

interface RzpResponse { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
interface RzpInstance { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void }
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => RzpInstance } }

let loading: Promise<boolean> | null = null;
function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  loading ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
    s.onload = () => resolve(true); s.onerror = () => { loading = null; resolve(false); };
    document.body.appendChild(s);
  });
  return loading;
}

export type PayResult = { status: "paid" } | { status: "dismissed" } | { status: "error"; message: string };

/** Opens Razorpay's payment window for an existing order, then verifies the payment on the server. */
export async function payWithRazorpay(orderId: string): Promise<PayResult> {
  const start = await startPayment(orderId);
  if (!start.ok) return { status: "error", message: start.error };
  if (!(await loadCheckout()) || !window.Razorpay) return { status: "error", message: "Could not load the payment window. Check your connection and try again." };

  return new Promise<PayResult>((resolve) => {
    const rzp = new window.Razorpay!({
      key: start.key, amount: start.amount, currency: "INR", order_id: start.rzpOrderId, name: "ManaBrand", description: `Order ${start.number}`,
      prefill: { name: start.name, email: start.email, contact: start.phone }, theme: { color: "#e0247a" },
      handler: async (r: RzpResponse) => {
        const done = await confirmPayment({ orderId, rzpOrderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
        resolve(done.ok ? { status: "paid" } : { status: "error", message: done.error });
      },
      modal: { ondismiss: () => resolve({ status: "dismissed" }) },
    });
    rzp.on("payment.failed", (r) => resolve({ status: "error", message: r.error?.description ?? "The payment failed. Please try again." }));
    rzp.open();
  });
}
