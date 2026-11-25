"use server";

import { revalidatePath } from "next/cache";
import { notifyContact, notifyNewsletter, notifyOrderPlaced, notifyOrderStatus } from "@/lib/email/notify";
import { createRzpOrder, onlinePaymentsLive, verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { refundOrderIfPaid } from "@/lib/payments/refund";
import { supabaseUrl } from "@/lib/supabase/env";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { emailError, nameError, normalizeEmail, normalizePhone } from "@/lib/auth/validation";
import { maxWalletForOrder } from "@/lib/wallet";
import { AREA, OUT_OF_AREA, inServiceArea } from "@/lib/locale";
import { clampStr, demoResult, fail, guarded, isUuid, live, type Result } from "./common";

/* ================================================================= orders */
export interface CartLineInput { productId: string; color: string; size: string; qty: number }
export interface AddressInput { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string }

/**
 * Places the order inside ONE database transaction (place_order): prices, stock, coupon and shipping are all
 * decided by the database. The browser only says WHAT it wants, never how much it costs.
 */
export async function placeOrder(input: {
  lines: CartLineInput[]; address: AddressInput; method: "upi" | "card" | "cod" | "netbanking"; coupon?: string | null; express?: boolean; wallet?: number;
}): Promise<Result<{ orderId: string; number: string; total: number; paymentStatus: "paid" | "pending" }>> {
  return guarded(["customer"], async (actor) => {
    const supabase = await createClient();
    const items = input.lines.map((l) => ({ product_id: l.productId, color: l.color, option_value: l.size, qty: l.qty }));
    if (!items.every((i) => isUuid(i.product_id))) return { ok: false, error: "Your bag contains items that are no longer available. Please remove them and try again." };
    const phone = normalizePhone(input.address.phone);
    if (!phone) return { ok: false, error: "Enter a valid delivery phone number." };
    if (!inServiceArea(String(input.address.pincode ?? ""))) return { ok: false, error: OUT_OF_AREA };
    const walletAsk = Math.max(0, Math.floor(Number(input.wallet) || 0));   // how much of the wallet to spend (the database caps it at the balance and the order total)
    const args = { p_items: items, p_address: { ...input.address, phone }, p_payment_method: input.method, p_coupon: input.coupon ?? null, p_express: Boolean(input.express) };

    let row: { order_id: string; order_number: string; total: number };

    if (walletAsk > 0) {
      // 1. Try place_order_wallet RPC first
      const rpcResult = await supabase.rpc("place_order_wallet", { ...args, p_wallet: walletAsk });
      if (rpcResult.error) {
        // If place_order_wallet function is not in schema cache, fallback to place_order + wallet ledger deduction
        if (/place_order_wallet/i.test(rpcResult.error.message) || rpcResult.error.code === "PGRST202") {
          const poRes = await supabase.rpc("place_order", args);
          if (poRes.error) throw new Error(poRes.error.message);
          const placed = (Array.isArray(poRes.data) ? poRes.data[0] : poRes.data) as { order_id: string; order_number: string; total: number };

          const adminDb = createAdminClient();
          const { data: txs } = await adminDb.from("wallet_transactions").select("amount").eq("user_id", actor.id);
          const balance = Math.max(0, (txs ?? []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0));

          const maxAllowed = maxWalletForOrder(placed.total);
          const useWallet = Math.max(0, Math.min(walletAsk, balance, placed.total, maxAllowed));

          if (useWallet > 0) {
            const newTotal = placed.total - useWallet;
            await adminDb.from("wallet_transactions").insert({
              user_id: actor.id,
              amount: -useWallet,
              kind: "order",
              order_id: placed.order_id,
              note: `Used on order ${placed.order_number}`,
            });

            await adminDb.from("orders").update({
              total: newTotal,
              wallet_used: useWallet,
              payment_status: newTotal === 0 ? "paid" : "pending",
              payment_ref: newTotal === 0 ? "wallet" : null,
            }).eq("id", placed.order_id);

            await adminDb.from("order_events").insert({
              order_id: placed.order_id,
              status: "placed",
              note: `Paid ₹${useWallet} from wallet`,
            });

            row = { order_id: placed.order_id, order_number: placed.order_number, total: newTotal };
          } else {
            row = placed;
          }
        } else {
          throw new Error(rpcResult.error.message);
        }
      } else {
        row = (Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data) as { order_id: string; order_number: string; total: number };
      }
    } else {
      const { data, error } = await supabase.rpc("place_order", args);
      if (error) throw new Error(error.message);
      row = (Array.isArray(data) ? data[0] : data) as { order_id: string; order_number: string; total: number };
    }

    if (row.total > 0 && input.method !== "cod" && !onlinePaymentsLive()) return { ok: false, error: "Online payment isn’t available yet — please choose Cash on delivery." };

    // PAYMENTS: cash on delivery is "pending" until delivery. If the order was 100% covered by wallet,
    // total is 0 and it's already marked paid in the database.
    const paymentStatus: "paid" | "pending" = row.total === 0 ? "paid" : "pending";
    void notifyOrderPlaced(row.order_id); // confirmation email (never blocks or fails the order)
    revalidatePath("/account/orders");
    return { ok: true, orderId: row.order_id, number: row.order_number, total: row.total, paymentStatus };
  });
}

export async function cancelOrder(orderId: string, reason: string): Promise<Result> {
  return guarded(["customer", "admin"], async () => {
    if (!isUuid(orderId)) return { ok: false, error: "Order not found." };
    const { error } = await (await createClient()).rpc("cancel_order", { p_order: orderId, p_reason: clampStr(reason, 200) });
    if (error) throw new Error(error.message);
    await refundOrderIfPaid(orderId); // paid online? the money goes back automatically
    try {
      const res = await createAdminClient().rpc("wallet_refund_order", { p_order: orderId });
      if (res?.error && /wallet_refund_order/i.test(res.error.message)) {
        // Fallback: refund wallet money directly if RPC not present in schema cache
        const adminDb = createAdminClient();
        const { data: ord } = await adminDb.from("orders").select("id, user_id, number, wallet_used").eq("id", orderId).maybeSingle();
        if (ord && ord.wallet_used > 0) {
          const { data: existingRefund } = await adminDb
            .from("wallet_transactions")
            .select("id")
            .eq("order_id", orderId)
            .eq("kind", "refund")
            .maybeSingle();

          if (!existingRefund) {
            await adminDb.from("wallet_transactions").insert({
              user_id: ord.user_id,
              amount: ord.wallet_used,
              kind: "refund",
              order_id: ord.id,
              note: `Refund for cancelled order ${ord.number}`,
            });
          }
        }
      }
    } catch {
      // Non-blocking wallet refund
    }
    void notifyOrderStatus(orderId, "cancelled");
    revalidatePath("/account/orders"); revalidatePath("/admin/orders");
    return { ok: true };
  });
}

export async function requestReturn(input: { orderId: string; itemId: string; type: "return" | "exchange"; reason: string; note?: string }): Promise<Result> {
  return guarded(["customer"], async () => {
    if (!isUuid(input.orderId) || !isUuid(input.itemId)) return { ok: false, error: "Item not found." };
    const { error } = await (await createClient()).rpc("request_return", {
      p_order: input.orderId, p_item: input.itemId, p_type: input.type, p_reason: clampStr(input.reason, 120), p_note: clampStr(input.note, 500) || null,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/account/returns"); revalidatePath(`/account/orders/${input.orderId}`);
    return { ok: true };
  });
}

/* ================================================================ addresses */
export async function saveAddress(input: AddressInput & { id?: string; label: "Home" | "Work" | "Other"; isDefault: boolean }): Promise<Result<{ id: string }>> {
  return guarded(["customer"], async (actor) => {
    const phone = normalizePhone(input.phone);
    if (!phone) return { ok: false, error: "Enter a valid 10-digit mobile number." };
    if (!inServiceArea(input.pincode)) return { ok: false, error: OUT_OF_AREA };
    const row = { user_id: actor.id, label: input.label, name: clampStr(input.name, 80), phone, line1: clampStr(input.line1, 160), line2: clampStr(input.line2, 160) || null,
      city: clampStr(input.city, 60), state: AREA.state, pincode: input.pincode, is_default: input.isDefault };
    if (!row.name || !row.line1 || !row.city) return { ok: false, error: "Please complete the address." };
    const supabase = await createClient();

    // Deduplication check: if adding new address, prevent duplicate entries from rapid double-clicks
    if (!input.id || !isUuid(input.id)) {
      const { data: existing } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", actor.id)
        .eq("line1", row.line1)
        .eq("pincode", row.pincode)
        .eq("phone", phone)
        .maybeSingle();

      if (existing) {
        if (input.isDefault) {
          await supabase.from("addresses").update({ is_default: false }).eq("user_id", actor.id);
          await supabase.from("addresses").update({ is_default: true }).eq("id", existing.id);
        }
        revalidatePath("/account/addresses");
        return { ok: true, id: existing.id };
      }
    }

    if (input.isDefault) await supabase.from("addresses").update({ is_default: false }).eq("user_id", actor.id);   // the unique index allows one default
    const q = input.id && isUuid(input.id) ? supabase.from("addresses").update(row).eq("id", input.id).eq("user_id", actor.id).select("id").single()
                                           : supabase.from("addresses").insert(row).select("id").single();
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    revalidatePath("/account/addresses");
    return { ok: true, id: (data as { id: string }).id };
  });
}
export async function deleteAddress(id: string): Promise<Result> {
  return guarded(["customer"], async (actor) => {
    const { error } = await (await createClient()).from("addresses").delete().eq("id", id).eq("user_id", actor.id);
    if (error) throw new Error(error.message);
    revalidatePath("/account/addresses");
    return { ok: true };
  });
}

/* ================================================================= profile */
export async function updateProfile(input: { name: string; dob?: string; notifyOrders: boolean; notifyOffers: boolean; notifyWhatsapp: boolean }): Promise<Result> {
  return guarded(["customer", "seller", "admin"], async (actor) => {
    const nErr = nameError(input.name); if (nErr) return { ok: false, error: nErr };
    const { error } = await (await createClient()).from("profiles").update({
      full_name: input.name.trim(), dob: input.dob || null, notify_orders: input.notifyOrders, notify_offers: input.notifyOffers, notify_whatsapp: input.notifyWhatsapp,
    }).eq("id", actor.id);
    if (error) throw new Error(error.message);
    revalidatePath("/account", "layout");
    return { ok: true };
  });
}

/* ========================================================= cart & wishlist */
export async function loadShopperState(): Promise<Result<{ wishlist: string[]; cart: { productId: string; color: string; size: string; qty: number }[]; coupon: string | null }>> {
  return guarded(["customer"], async (actor) => {
    const supabase = await createClient();
    const [w, c] = await Promise.all([
      supabase.from("wishlists").select("product_id").eq("user_id", actor.id).order("created_at", { ascending: false }),
      supabase.from("carts").select("coupon, cart_items(product_id, color, option_value, qty)").eq("user_id", actor.id).maybeSingle(),
    ]);
    const cart = ((c.data as { coupon: string | null; cart_items: { product_id: string; color: string | null; option_value: string; qty: number }[] } | null)?.cart_items ?? [])
      .map((i) => ({ productId: i.product_id, color: i.color ?? "", size: i.option_value, qty: i.qty }));
    return { ok: true, wishlist: (w.data ?? []).map((x: { product_id: string }) => x.product_id), cart, coupon: (c.data as { coupon: string | null } | null)?.coupon ?? null };
  });
}
export async function saveWishlist(productIds: string[]): Promise<Result> {
  return guarded(["customer"], async (actor) => {
    const ids = [...new Set(productIds.filter(isUuid))].slice(0, 200);
    const supabase = await createClient();
    await supabase.from("wishlists").delete().eq("user_id", actor.id);
    if (ids.length) { const { error } = await supabase.from("wishlists").insert(ids.map((p) => ({ user_id: actor.id, product_id: p }))); if (error) throw new Error(error.message); }
    return { ok: true };
  });
}
export async function saveCart(lines: CartLineInput[], coupon: string | null): Promise<Result> {
  return guarded(["customer"], async (actor) => {
    const supabase = await createClient();
    const { data: cart, error } = await supabase.from("carts").upsert({ user_id: actor.id, coupon, updated_at: new Date().toISOString(), reminded_at: null }, { onConflict: "user_id" }).select("id").single();
    if (error) throw new Error(error.message);
    const id = (cart as { id: string }).id;
    await supabase.from("cart_items").delete().eq("cart_id", id);
    const rows = lines.filter((l) => isUuid(l.productId)).slice(0, 40).map((l) => ({ cart_id: id, product_id: l.productId, color: l.color || null, option_value: l.size, qty: Math.min(10, Math.max(1, l.qty)) }));
    if (rows.length) { const { error: e2 } = await supabase.from("cart_items").insert(rows); if (e2) throw new Error(e2.message); }
    return { ok: true };
  });
}

/* ================================================================== reviews */
export async function submitReview(input: { productId: string; rating: number; title: string; body: string; images?: string[] }): Promise<Result> {
  return guarded(["customer"], async (actor) => {
    if (!isUuid(input.productId)) return { ok: false, error: "Product not found." };
    if (!(input.rating >= 1 && input.rating <= 5)) return { ok: false, error: "Choose a rating from 1 to 5." };
    const body = clampStr(input.body, 1000);
    if (body.length < 10) return { ok: false, error: "Please write at least a few words." };
    // photos must be files this customer uploaded to the review-images bucket (their own folder), at most 3
    const prefix = `${supabaseUrl}/storage/v1/object/public/review-images/${actor.id}/`;
    const images = (input.images ?? []).filter((u) => typeof u === "string" && u.startsWith(prefix) && !u.includes("..")).slice(0, 3);
    const supabase = await createClient();
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", actor.id).single(),
      supabase.from("addresses").select("city").eq("user_id", actor.id).order("is_default", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const name = (p as { full_name: string } | null)?.full_name ?? "Customer";
    const { error } = await supabase.from("reviews").insert({
      product_id: input.productId, user_id: actor.id, rating: Math.round(input.rating), title: clampStr(input.title, 80), body,
      ...(images.length ? { images } : {}), status: "pending", verified: true, author_name: `${name.split(" ")[0]} ${name.split(" ")[1]?.[0] ?? ""}.`.replace(/ \.$/, ""), author_city: (a as { city: string } | null)?.city ?? null,
    });
    // RLS only lets verified buyers (delivered order) in, and only as 'pending'
    if (error) return { ok: false, error: /duplicate/i.test(error.message) ? "You’ve already reviewed this product." : "Only customers who received this product can review it." };
    return { ok: true };
  });
}

/* ================================================================== follows */
export async function toggleFollow(sellerId: string): Promise<Result<{ following: boolean }>> {
  return guarded(["customer"], async (actor) => {
    const supabase = await createClient();
    const { data } = await supabase.from("seller_follows").select("seller_id").eq("seller_id", sellerId).eq("user_id", actor.id).maybeSingle();
    if (data) { await supabase.from("seller_follows").delete().eq("seller_id", sellerId).eq("user_id", actor.id); return { ok: true, following: false }; }
    const { error } = await supabase.from("seller_follows").insert({ seller_id: sellerId, user_id: actor.id });
    if (error) throw new Error(error.message);
    return { ok: true, following: true };
  });
}

/* ============================================================ public forms */
export async function subscribeNewsletter(emailRaw: string): Promise<Result> {
  if (!live()) return demoResult();
  const email = normalizeEmail(emailRaw);
  if (!email) return { ok: false, error: emailError(emailRaw) ?? "Enter a valid email." };
  try {
    // ignoreDuplicates: only a genuinely new address comes back, so the welcome email (with the code) is sent once
    const { data, error } = await createAdminClient().from("newsletter_subscribers").upsert({ email }, { onConflict: "email", ignoreDuplicates: true }).select("email");
    if (error) throw new Error(error.message);
    if (data?.length) void notifyNewsletter(email);
    return { ok: true };
  } catch (e) { return fail(e); }
}

export async function sendContactMessage(input: { name: string; email: string; topic: string; message: string; phone?: string; order?: string }): Promise<Result> {
  if (!live()) return demoResult();
  const email = normalizeEmail(input.email);
  if (!email || nameError(input.name) || clampStr(input.message, 2000).length < 10) return { ok: false, error: "Please fill in your name, a valid email and a message." };
  try {
    const phone = normalizePhone(input.phone ?? "") ?? undefined, order = clampStr(input.order, 20) || undefined;
    const message = clampStr(input.message, 2000);
    // phone / order number have no column of their own — keep them with the message so nothing is lost
    const stored = [message, phone && `Phone: ${phone}`, order && `Order: ${order}`].filter(Boolean).join("\n\n");
    const { error } = await createAdminClient().from("contact_messages").insert({ name: clampStr(input.name, 80), email, topic: clampStr(input.topic, 60), message: stored });
    if (error) throw new Error(error.message);
    void notifyContact({ name: clampStr(input.name, 80), email, phone, order, topic: clampStr(input.topic, 60), message });
    return { ok: true };
  } catch (e) { return fail(e); }
}

/* ============================================================ online payment (Razorpay) */
/** Step 1: create the Razorpay order for an existing, unpaid online order and return what the payment window needs. */
export async function startPayment(orderId: string): Promise<Result<{ key: string; rzpOrderId: string; amount: number; number: string; name: string; email: string; phone: string }>> {
  return guarded(["customer"], async (actor) => {
    if (!onlinePaymentsLive()) return { ok: false, error: "Online payment isn’t available yet — please use cash on delivery." };
    if (!isUuid(orderId)) return { ok: false, error: "Order not found." };
    const supabase = await createClient();
    const { data } = await supabase.from("orders").select("id, number, total, status, payment_method, payment_status").eq("id", orderId).maybeSingle();   // RLS: only your own orders
    const o = data as { id: string; number: string; total: number; status: string; payment_method: string; payment_status: string } | null;
    if (!o) return { ok: false, error: "Order not found." };
    if (o.payment_method === "cod") return { ok: false, error: "This order is cash on delivery." };
    if (o.payment_status === "paid") return { ok: false, error: "This order is already paid." };
    if (o.status === "cancelled") return { ok: false, error: "This order was cancelled." };
    const rz = await createRzpOrder({ amountInr: o.total, receipt: o.number, notes: { order_id: o.id } });
    if (!rz.ok) return { ok: false, error: "We couldn’t start the payment. Please try again in a moment." };
    await createAdminClient().from("orders").update({ payment_ref: rz.data.id }).eq("id", o.id);   // until paid, payment_ref holds the Razorpay order id
    const { data: prof } = await supabase.from("profiles").select("full_name, email, phone").eq("id", actor.id).single();
    const p = prof as { full_name: string; email: string; phone: string | null } | null;
    return { ok: true, key: (process.env.RAZORPAY_KEY_ID?.trim() ?? ""), rzpOrderId: rz.data.id, amount: rz.data.amount, number: o.number, name: p?.full_name ?? "", email: p?.email ?? "", phone: p?.phone ?? "" };
  });
}

/** Step 2: the payment window returned success — verify the signature on the server, then mark the order paid. */
export async function confirmPayment(input: { orderId: string; rzpOrderId: string; paymentId: string; signature: string }): Promise<Result> {
  return guarded(["customer"], async (actor) => {
    if (!isUuid(input.orderId) || !input.rzpOrderId || !input.paymentId || !input.signature) return { ok: false, error: "Payment details are missing." };
    if (!verifyCheckoutSignature(input.rzpOrderId, input.paymentId, input.signature)) return { ok: false, error: "We couldn’t verify this payment. If money was deducted it will be refunded automatically." };
    const db = createAdminClient();
    const { data } = await db.from("orders").select("id, user_id, payment_ref").eq("id", input.orderId).maybeSingle();
    const o = data as { id: string; user_id: string; payment_ref: string | null } | null;
    if (!o || o.user_id !== actor.id || o.payment_ref !== input.rzpOrderId) return { ok: false, error: "This payment doesn’t match your order." };
    const { error } = await db.rpc("confirm_payment", { p_order: o.id, p_ref: input.paymentId });
    if (error) throw new Error(error.message);
    revalidatePath("/account/orders"); revalidatePath("/admin/orders");
    return { ok: true };
  });
}

/* ============================================================ back-in-stock alerts */
export async function subscribeStockAlert(input: { productId: string; size: string; email: string }): Promise<Result> {
  if (!live()) return demoResult();
  const email = normalizeEmail(input.email);
  if (!email || !isUuid(input.productId)) return { ok: false, error: "Enter a valid email address." };
  try {
    const { error } = await createAdminClient().from("stock_alerts").upsert(
      { product_id: input.productId, option_value: clampStr(input.size, 30), email }, { onConflict: "product_id,option_value,email", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (e) { return fail(e); }
}
