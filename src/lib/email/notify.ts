import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/env";
import { SUPPORT_EMAIL, sendEmail } from "./send";
import * as t from "./templates";

/**
 * "When X happens, email Y" — one function per event. All are fire-and-forget (call with `void`) and never throw.
 * They look up what they need with the service-role client, so callers only pass an id.
 */
const safe = async (fn: () => Promise<unknown>) => { try { await fn(); } catch (e) { console.error("[email] notify failed:", e instanceof Error ? e.message : e); } };

interface Buyer { email: string; full_name: string; notify_orders: boolean }
async function buyerOf(userId: string): Promise<Buyer | null> {
  const { data } = await createAdminClient().from("profiles").select("email, full_name, notify_orders").eq("id", userId).maybeSingle();
  return (data as Buyer | null) ?? null;
}

/** Order placed → confirmation with items, totals and address. (Transactional: sent even if marketing mail is off.) */
export const notifyOrderPlaced = (orderId: string) => safe(async () => {
  const { data: o } = await createAdminClient().from("orders")
    .select("number, total, subtotal, discount, shipping_fee, payment_method, address, user_id, order_items(name, qty, price, color, option_value)").eq("id", orderId).single();
  if (!o) return;
  const b = await buyerOf(o.user_id); if (!b) return;
  const items = (o.order_items ?? []) as { name: string; qty: number; price: number; color: string | null; option_value: string }[];
  await sendEmail({ to: b.email, ...t.orderConfirmedEmail({
    name: b.full_name, number: o.number, total: o.total, paymentMethod: o.payment_method, siteUrl: siteUrl(), address: o.address,
    subtotal: o.subtotal, discount: o.discount, shipping: o.shipping_fee,
    items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, size: i.option_value, color: i.color ?? undefined })),
  }) });
});

/** Order moved to shipped / out for delivery / delivered / cancelled → tell the customer (respects "order updates" preference). */
export const notifyOrderStatus = (orderId: string, status: string) => safe(async () => {
  if (!t.EMAIL_STATUSES.includes(status)) return;
  const { data: o } = await createAdminClient().from("orders").select("number, user_id, awb, courier").eq("id", orderId).single();
  if (!o) return;
  const b = await buyerOf(o.user_id); if (!b || !b.notify_orders) return;
  const m = t.orderStatusEmail({ name: b.full_name, number: o.number, status, awb: o.awb, courier: o.courier, siteUrl: siteUrl() });
  if (m) await sendEmail({ to: b.email, ...m });
});

/** Return request decided / progressed → tell the customer. */
export const notifyReturnStatus = (returnId: string, status: string) => safe(async () => {
  const { data: r } = await createAdminClient().from("returns").select("user_id, orders(number)").eq("id", returnId).single();
  if (!r) return;
  const b = await buyerOf(r.user_id); if (!b || !b.notify_orders) return;
  const number = (r.orders as unknown as { number: string } | null)?.number ?? "";
  const m = t.returnUpdateEmail({ name: b.full_name, number, status, siteUrl: siteUrl() });
  if (m) await sendEmail({ to: b.email, ...m });
});

/** Contact form → the ManaBrand inbox (Reply goes to the customer) + an auto-reply to the customer. */
export const notifyContact = (c: { name: string; email: string; phone?: string; order?: string; topic: string; message: string }) => safe(async () => {
  await Promise.all([
    sendEmail({ to: SUPPORT_EMAIL(), replyTo: c.email, ...t.contactInboxEmail({ ...c, siteUrl: siteUrl() }) }),
    sendEmail({ to: c.email, ...t.contactAckEmail({ name: c.name, topic: c.topic, message: c.message, siteUrl: siteUrl() }) }),
  ]);
});

/** First-time newsletter sign-up → welcome + WELCOME10 code. */
export const notifyNewsletter = (email: string) => safe(async () => { await sendEmail({ to: email, ...t.newsletterWelcomeEmail(siteUrl()) }); });

/** Seller applied → confirmation to the seller + a heads-up to the ManaBrand inbox. */
export const notifySellerApplied = (s: { store: string; owner: string; email: string; city: string }) => safe(async () => {
  await Promise.all([
    sendEmail({ to: s.email, ...t.sellerAppliedEmail({ store: s.store, owner: s.owner, siteUrl: siteUrl() }) }),
    sendEmail({ to: SUPPORT_EMAIL(), ...t.sellerAppliedAdminEmail({ store: s.store, owner: s.owner, city: s.city, siteUrl: siteUrl() }) }),
  ]);
});

/** Admin approved / suspended / rejected a store → tell the seller. */
export const notifySellerDecision = (s: { store: string; owner: string; email: string; status: "active" | "suspended" | "rejected" }) => safe(async () => {
  await sendEmail({ to: s.email, ...t.sellerDecisionEmail({ store: s.store, owner: s.owner, status: s.status, siteUrl: siteUrl() }) });
});
