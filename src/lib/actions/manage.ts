"use server";

import { revalidatePath } from "next/cache";
import { passwordError, normalizeEmail, normalizePhone, nameError } from "@/lib/auth/validation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { clampStr, demoResult, fail, guarded, isUuid, live, slugify, type Result } from "./common";
import { lockoutStatus, recordAttempt, clientIp } from "@/lib/auth/throttle";
import { DEFAULT_PERMISSIONS, mergePermissions } from "@/lib/permissions";
import type { SellerPermissions } from "@/types";

const bust = (...paths: string[]) => paths.forEach((p) => revalidatePath(p, "layout"));

/** The signed-in seller's store + what the admin allows them to do. Works even before the permissions column exists (defaults). */
async function mySeller(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  let r = await supabase.from("sellers").select("id, status, permissions").eq("owner_id", userId).maybeSingle();
  if (r.error) r = (await supabase.from("sellers").select("id, status").eq("owner_id", userId).maybeSingle()) as typeof r;
  const row = r.data as { id: string; status: string; permissions?: unknown } | null;
  return row ? { id: row.id, status: row.status, perms: mergePermissions(row.permissions) } : null;
}
const DENIED = (what: string) => ({ ok: false as const, error: `${what} isn’t enabled for your store. Ask the ManaBrand team to switch it on.` });

/* ============================================================ order flow */
/** Shared by admin and seller. The database decides who may make which step (set_order_status). */
export async function setOrderStatus(orderId: string, status: string, note?: string): Promise<Result> {
  return guarded(["admin", "seller"], async () => {
    if (!isUuid(orderId)) return { ok: false, error: "Order not found." };
    const { error } = await (await createClient()).rpc("set_order_status", { p_order: orderId, p_status: status, p_note: clampStr(note, 200) || null });
    if (error) throw new Error(error.message);
    bust("/admin", "/seller", "/account");
    return { ok: true };
  });
}
export async function addOrderNote(orderId: string, body: string): Promise<Result> {
  return guarded(["admin"], async (actor) => {
    const text = clampStr(body, 1000); if (!text) return { ok: false, error: "Write a note first." };
    const { error } = await (await createClient()).from("order_notes").insert({ order_id: orderId, author_id: actor.id, body: text });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
}
export async function decideReturn(returnId: string, status: "approved" | "rejected" | "picked_up" | "refunded"): Promise<Result> {
  return guarded(["admin", "seller"], async () => {
    const { error } = await (await createClient()).rpc("decide_return", { p_return: returnId, p_status: status });
    if (error) throw new Error(error.message);
    bust("/admin", "/seller", "/account");
    return { ok: true };
  });
}

/* ================================================================ products */
export interface ProductInput {
  id?: string; name: string; categorySlug: string; subcategory?: string; description: string; material?: string;
  price: number; mrp: number; optionLabel: string; colors: { name: string; hex: string }[]; options: { value: string; stock: number }[];
  publish: boolean; sellerId?: string; featured?: boolean;
}

export async function saveProduct(input: ProductInput): Promise<Result<{ id: string }>> {
  return guarded(["admin", "seller"], async (actor) => {
    const supabase = await createClient();
    const name = clampStr(input.name, 140);
    if (name.length < 3) return { ok: false, error: "Give your product a clear name." };
    if (clampStr(input.description, 600).length < 20) return { ok: false, error: "Describe the product in at least 20 characters." };
    if (!(input.price > 0) || input.mrp < input.price) return { ok: false, error: "MRP must be at least the selling price." };
    if (!input.options.length) return { ok: false, error: "Add at least one size / option." };
    if (!input.colors.length) return { ok: false, error: "Add at least one colour." };

    // who owns it
    let sellerId = input.sellerId;
    let sellerPerms: SellerPermissions = DEFAULT_PERMISSIONS;
    if (actor.role === "seller") {
      const me = await mySeller(supabase, actor.id);
      if (!me) return { ok: false, error: "Seller account not found." };
      if (me.status !== "active") return { ok: false, error: "Your store is awaiting approval — you can list products once it’s approved." };
      if (!me.perms.add_products) return DENIED("Adding and editing products");
      sellerId = me.id; sellerPerms = me.perms;
    }
    if (!isUuid(sellerId)) return { ok: false, error: "Choose a seller." };

    const { data: cat } = await supabase.from("categories").select("id, photo_kind").eq("slug", input.categorySlug).maybeSingle();
    if (!cat) return { ok: false, error: "Choose a category." };
    const catRow = cat as { id: string; photo_kind: string };
    let subId: string | null = null;
    if (input.subcategory) {
      const { data: sub } = await supabase.from("subcategories").select("id").eq("category_id", catRow.id).eq("name", input.subcategory).maybeSingle();
      subId = (sub as { id: string } | null)?.id ?? null;
    }

    const isAdmin = actor.role === "admin";
    // admin: publishes directly. seller: goes live only if the admin allowed "publish without review", otherwise waits for review
    const status = isAdmin ? (input.publish ? "active" : "draft") : input.publish ? (sellerPerms.publish_directly ? "active" : "pending_review") : "draft";
    const fields = {
      name, description: clampStr(input.description, 600), material: clampStr(input.material, 200), price: Math.round(input.price), mrp: Math.round(input.mrp),
      option_label: clampStr(input.optionLabel, 20) || "Standard", category_id: catRow.id, subcategory_id: subId, photo_kind: catRow.photo_kind, status,
      ...(isAdmin && input.featured !== undefined ? { badges: input.featured ? ["bestseller"] : [] } : {}),
    };

    let id = input.id;
    if (id && isUuid(id)) {
      const { error } = await supabase.from("products").update({ ...fields, ...(isAdmin ? { seller_id: sellerId } : {}) }).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase.from("products").insert({ ...fields, seller_id: sellerId, slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`, tags: [input.categorySlug, (input.subcategory ?? "").toLowerCase()].filter(Boolean) }).select("id").single();
      if (error) throw new Error(error.message);
      id = (data as { id: string }).id;
    }

    // colours & options: upsert what's listed, remove what's gone
    const colors = input.colors.slice(0, 20).map((c, i) => ({ product_id: id, name: clampStr(c.name, 30), hex: /^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#d9d3c7", sort: i }));
    const options = input.options.slice(0, 40).map((o, i) => ({ product_id: id, value: clampStr(o.value, 30), stock: Math.max(0, Math.floor(o.stock)), sort: i }));
    const [c1, o1] = await Promise.all([
      supabase.from("product_colors").upsert(colors, { onConflict: "product_id,name" }),
      supabase.from("product_options").upsert(options, { onConflict: "product_id,value" }),
    ]);
    if (c1.error) throw new Error(c1.error.message);
    if (o1.error) throw new Error(o1.error.message);
    await supabase.from("product_colors").delete().eq("product_id", id).not("name", "in", `(${colors.map((c) => `"${c.name.replace(/"/g, "")}"`).join(",")})`);
    await supabase.from("product_options").delete().eq("product_id", id).not("value", "in", `(${options.map((o) => `"${o.value.replace(/"/g, "")}"`).join(",")})`);

    bust("/admin", "/seller", "/shop", "/product");
    return { ok: true, id: id! };
  });
}

/** Archive rather than delete when the product already appears on orders. */
export async function removeProduct(id: string): Promise<Result<{ archived: boolean }>> {
  return guarded(["admin", "seller"], async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) { bust("/admin", "/seller", "/shop"); return { ok: true, archived: false }; }
    if (/foreign key/i.test(error.message)) {
      const { error: e2 } = await supabase.from("products").update({ status: "draft" }).eq("id", id);
      if (e2) throw new Error(e2.message);
      bust("/admin", "/seller", "/shop"); return { ok: true, archived: true };
    }
    throw new Error(error.message);
  });
}

export async function setProductStatus(id: string, status: "active" | "draft"): Promise<Result> {
  return guarded(["admin", "seller"], async (actor) => {
    // a seller may always pause (→ draft). Putting a product live: straight away only if the admin allowed "publish without review", otherwise it goes to review
    const supabase = await createClient();
    let next: "active" | "draft" | "pending_review" = status;
    if (actor.role === "seller") {
      const me = await mySeller(supabase, actor.id);
      if (!me || me.status !== "active") return { ok: false, error: "Your store isn’t active." };
      if (status === "active") { if (!me.perms.add_products) return DENIED("Publishing products"); next = me.perms.publish_directly ? "active" : "pending_review"; }
    }
    const { error } = await supabase.from("products").update({ status: next }).eq("id", id);
    if (error) throw new Error(error.message);
    bust("/admin", "/seller", "/shop");
    return { ok: true };
  });
}

export async function addProductImages(productId: string, urls: string[]): Promise<Result> {
  return guarded(["admin", "seller"], async () => {
    const supabase = await createClient();
    const { count } = await supabase.from("product_images").select("*", { count: "exact", head: true }).eq("product_id", productId);
    const start = count ?? 0;
    const rows = urls.slice(0, 6).map((url, i) => ({ product_id: productId, url, sort: start + i, is_cover: start + i === 0 }));
    const { error } = await supabase.from("product_images").insert(rows);
    if (error) throw new Error(error.message);
    bust("/admin", "/seller", "/shop", "/product");
    return { ok: true };
  });
}
export async function removeProductImage(imageId: string): Promise<Result> {
  return guarded(["admin", "seller"], async () => {
    const { error } = await (await createClient()).from("product_images").delete().eq("id", imageId);
    if (error) throw new Error(error.message);
    bust("/admin", "/seller", "/product");
    return { ok: true };
  });
}

/* ========================================================== seller inventory */
export async function updateInventory(updates: { productId: string; value: string; stock: number }[]): Promise<Result<{ updated: number }>> {
  return guarded(["admin", "seller"], async (actor) => {
    const supabase = await createClient();
    if (actor.role === "seller") { const me = await mySeller(supabase, actor.id); if (!me || me.status !== "active") return { ok: false, error: "Your store isn’t active." }; if (!me.perms.manage_inventory) return DENIED("Stock management"); }
    let n = 0;
    for (const u of updates.slice(0, 500)) {
      if (!isUuid(u.productId)) continue;
      const { error } = await supabase.from("product_options").update({ stock: Math.max(0, Math.floor(u.stock)) }).eq("product_id", u.productId).eq("value", u.value);
      if (error) throw new Error(error.message);
      n++;
    }
    bust("/seller", "/admin", "/shop");
    return { ok: true, updated: n };
  });
}

/* ================================================================= catalogue */
export async function saveCategory(input: { id?: string; name: string; tagline: string; group?: string }): Promise<Result> {
  return guarded(["admin"], async () => {
    const name = clampStr(input.name, 40); if (!name) return { ok: false, error: "Category name is required." };
    const supabase = await createClient();
    const row = { name, tagline: clampStr(input.tagline, 80) };
    const { error } = input.id && isUuid(input.id) ? await supabase.from("categories").update(row).eq("id", input.id)
                                                   : await supabase.from("categories").insert({ ...row, slug: input.group === "men" || input.group === "women" ? `${input.group}-${slugify(name)}` : slugify(name) });
    if (error) throw new Error(error.message);
    bust("/admin", "/shop"); return { ok: true };
  });
}
export async function addSubcategory(categoryId: string, name: string): Promise<Result> {
  return guarded(["admin"], async () => {
    const n = clampStr(name, 40); if (!n) return { ok: false, error: "Enter a name." };
    const { error } = await (await createClient()).from("subcategories").insert({ category_id: categoryId, name: n });
    if (error) throw new Error(error.message);
    bust("/admin", "/shop"); return { ok: true };
  });
}
export async function removeSubcategory(categoryId: string, name: string): Promise<Result> {
  return guarded(["admin"], async () => {
    const { error } = await (await createClient()).from("subcategories").delete().eq("category_id", categoryId).eq("name", name);
    if (error) throw new Error(error.message);
    bust("/admin", "/shop"); return { ok: true };
  });
}

/* ================================================================== coupons */
export async function saveCoupon(input: { id?: string; code: string; type: "percent" | "flat" | "shipping"; value: number; minOrder: number; usageLimit: number; expires: string; description?: string }): Promise<Result> {
  return guarded(["admin"], async () => {
    const code = clampStr(input.code, 14).toUpperCase();
    if (!/^[A-Z0-9]{4,14}$/.test(code)) return { ok: false, error: "Code must be 4–14 letters or digits." };
    if (input.type === "percent" && !(input.value > 0 && input.value <= 80)) return { ok: false, error: "Percent must be between 1 and 80." };
    const row = { code, type: input.type, value: Math.max(0, Math.floor(input.value)), min_order: Math.max(0, Math.floor(input.minOrder)), usage_limit: Math.max(1, Math.floor(input.usageLimit)),
      expires_at: input.expires || null, description: clampStr(input.description, 120) };
    const supabase = await createClient();
    const { error } = input.id && isUuid(input.id) ? await supabase.from("coupons").update(row).eq("id", input.id) : await supabase.from("coupons").insert(row);
    if (error) throw new Error(error.message);
    bust("/admin", "/cart", "/checkout"); return { ok: true };
  });
}
export async function setCouponStatus(id: string, status: "active" | "paused"): Promise<Result> {
  return guarded(["admin"], async () => {
    const { error } = await (await createClient()).from("coupons").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    bust("/admin"); return { ok: true };
  });
}

/* ================================================================== banners */
export async function saveBanner(input: { id?: string; title: string; subtitle: string; cta: string; href: string; placement?: string; starts: string; ends: string }): Promise<Result> {
  return guarded(["admin"], async () => {
    const title = clampStr(input.title, 80); if (!title) return { ok: false, error: "Headline is required." };
    const row = { title, subtitle: clampStr(input.subtitle, 160), cta: clampStr(input.cta, 30) || "Shop now", href: clampStr(input.href, 200) || "/shop", starts_on: input.starts || null, ends_on: input.ends || null };
    const supabase = await createClient();
    const { error } = input.id && isUuid(input.id) ? await supabase.from("banners").update(row).eq("id", input.id) : await supabase.from("banners").insert({ ...row, placement: input.placement ?? "home-hero" });
    if (error) throw new Error(error.message);
    bust("/admin", "/"); return { ok: true };
  });
}
export async function setBannerStatus(id: string, status: "live" | "draft"): Promise<Result> {
  return guarded(["admin"], async () => {
    const { error } = await (await createClient()).from("banners").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    bust("/admin", "/"); return { ok: true };
  });
}

/* =============================================================== collections */
/** Create or update a collection and replace the set of products inside it. */
export async function saveCollection(input: { id?: string; name: string; story: string; photo: string; productIds: string[] }): Promise<Result<{ id: string }>> {
  return guarded(["admin"], async () => {
    const name = clampStr(input.name, 60); if (name.length < 2) return { ok: false, error: "Give the collection a name." };
    const supabase = await createClient();
    const fields = { name, story: clampStr(input.story, 200), photo_kind: clampStr(input.photo, 30) || "dress" };
    let id = input.id && isUuid(input.id) ? input.id : undefined;
    if (id) {
      const { error } = await supabase.from("collections").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const base = slugify(name) || "collection";
      const { data: taken } = await supabase.from("collections").select("slug").like("slug", `${base}%`);
      const used = new Set((taken ?? []).map((r: { slug: string }) => r.slug));
      let slug = base; for (let i = 2; used.has(slug); i++) slug = `${base}-${i}`;
      const { data: last } = await supabase.from("collections").select("sort").order("sort", { ascending: false }).limit(1);
      const { data, error } = await supabase.from("collections").insert({ ...fields, slug, sort: ((last?.[0] as { sort?: number } | undefined)?.sort ?? 0) + 1 }).select("id").single();
      if (error) throw new Error(error.message);
      id = (data as { id: string }).id;
    }
    const ids = [...new Set(input.productIds.filter(isUuid))].slice(0, 200);
    const { error: dErr } = await supabase.from("collection_products").delete().eq("collection_id", id);
    if (dErr) throw new Error(dErr.message);
    if (ids.length) {
      const { error: iErr } = await supabase.from("collection_products").insert(ids.map((product_id, i) => ({ collection_id: id, product_id, sort: i })));
      if (iErr) throw new Error(iErr.message);
    }
    bust("/admin", "/collections", "/");
    return { ok: true, id: id! };
  });
}
export async function removeCollection(id: string): Promise<Result> {
  return guarded(["admin"], async () => {
    if (!isUuid(id)) return { ok: false, error: "Collection not found." };
    const { error } = await (await createClient()).from("collections").delete().eq("id", id);
    if (error) throw new Error(error.message);
    bust("/admin", "/collections", "/");
    return { ok: true };
  });
}

/* ============================================================ moderation etc */
export async function moderateReview(id: string, action: "publish" | "remove"): Promise<Result> {
  return guarded(["admin"], async () => {
    const supabase = await createClient();
    const { error } = action === "publish" ? await supabase.from("reviews").update({ status: "published" }).eq("id", id) : await supabase.from("reviews").delete().eq("id", id);
    if (error) throw new Error(error.message);
    bust("/admin", "/product"); return { ok: true };
  });
}
/** Sellers reply publicly; verified here because the reply column can't be opened to direct writes. */
export async function replyToReview(reviewId: string, reply: string): Promise<Result> {
  return guarded(["seller"], async (actor) => {
    const text = clampStr(reply, 500); if (!text) return { ok: false, error: "Write a reply first." };
    const supabase = await createClient();
    const { data } = await supabase.from("reviews").select("id, products!inner(seller_id, sellers!inner(owner_id))").eq("id", reviewId).maybeSingle();
    const owner = (data as { products?: { sellers?: { owner_id: string } } } | null)?.products?.sellers?.owner_id;
    if (owner !== actor.id) return { ok: false, error: "You can only reply to reviews of your own products." };
    const { error } = await createAdminClient().from("reviews").update({ seller_reply: text }).eq("id", reviewId);
    if (error) throw new Error(error.message);
    bust("/seller", "/product"); return { ok: true };
  });
}

export async function setCustomerBlocked(userId: string, blocked: boolean): Promise<Result> {
  return guarded(["admin"], async () => {
    const { error } = await (await createClient()).from("profiles").update({ status: blocked ? "blocked" : "active" }).eq("id", userId);
    if (error) throw new Error(error.message);
    bust("/admin"); return { ok: true };
  });
}

export async function setSellerStatus(sellerId: string, status: "active" | "suspended" | "rejected"): Promise<Result> {
  return guarded(["admin"], async () => {
    const supabase = await createClient();
    const patch: Record<string, string> = { status };
    if (status === "active") patch.kyc = "verified";
    const { data, error } = await supabase.from("sellers").update(patch).eq("id", sellerId).select("owner_id, name").single();
    if (error) throw new Error(error.message);
    const s = data as { owner_id: string | null; name: string };
    if (s.owner_id) await createAdminClient().from("notifications").insert({ user_id: s.owner_id, audience: "seller", kind: "seller",
      title: status === "active" ? "Your store is approved 🎉" : `Your store was ${status}`, body: status === "active" ? "You can now list products." : "Contact support for details." });
    bust("/admin", "/seller"); return { ok: true };
  });
}
/** Admin: choose what this seller may do in their dashboard. */
export async function setSellerPermissions(sellerId: string, perms: SellerPermissions): Promise<Result> {
  return guarded(["admin"], async () => {
    if (!isUuid(sellerId)) return { ok: false, error: "Seller not found." };
    const clean = mergePermissions(perms);
    const { error } = await (await createClient()).from("sellers").update({ permissions: clean }).eq("id", sellerId);
    if (error) return { ok: false, error: /permissions/.test(error.message) ? "Run the latest database migration (…0008_seller_permissions.sql) first." : error.message };
    bust("/admin", "/seller"); return { ok: true };
  });
}
export async function setSellerCommission(sellerId: string, pct: number): Promise<Result> {
  return guarded(["admin"], async () => {
    if (!(pct >= 0 && pct <= 40)) return { ok: false, error: "Enter a rate between 0 and 40%." };
    const { error } = await (await createClient()).from("sellers").update({ commission_pct: pct }).eq("id", sellerId);
    if (error) throw new Error(error.message);
    bust("/admin"); return { ok: true };
  });
}

export async function generatePayouts(start: string, end: string): Promise<Result<{ created: number }>> {
  return guarded(["admin"], async () => {
    const { data, error } = await (await createClient()).rpc("generate_payouts", { p_start: start, p_end: end });
    if (error) throw new Error(error.message);
    bust("/admin"); return { ok: true, created: Number(data ?? 0) };
  });
}
export async function setPayoutStatus(id: string, status: "scheduled" | "processing" | "paid" | "on_hold"): Promise<Result<{ utr?: string }>> {
  return guarded(["admin"], async () => {
    const utr = status === "paid" ? `MANA${Date.now().toString(36).toUpperCase()}` : undefined;   // replace with the bank's UTR once payouts are automated
    const { error } = await (await createClient()).from("payouts").update({ status, ...(utr ? { utr, paid_at: new Date().toISOString() } : {}) }).eq("id", id);
    if (error) throw new Error(error.message);
    bust("/admin", "/seller"); return { ok: true, utr };
  });
}

export async function saveSetting(key: "shipping" | "payments" | "commission" | "business", value: Record<string, unknown>): Promise<Result> {
  return guarded(["admin"], async () => {
    const { error } = await (await createClient()).from("settings").upsert({ key, value }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    bust("/admin", "/cart", "/checkout"); return { ok: true };
  });
}
export async function markNotificationsRead(): Promise<Result> {
  return guarded(["admin", "seller", "customer"], async (actor) => {
    const supabase = await createClient();
    await supabase.from("notifications").update({ read: true }).eq("user_id", actor.id);
    if (actor.role === "admin") await supabase.from("notifications").update({ read: true }).eq("audience", "admin");
    bust("/admin", "/seller"); return { ok: true };
  });
}

/* ============================================================= seller portal */
export async function saveStoreProfile(input: { name: string; blurb: string; phone: string; email: string; pickupAddress: string; holidayMode?: boolean; logoUrl?: string; bannerUrl?: string }): Promise<Result> {
  return guarded(["seller"], async (actor) => {
    if (clampStr(input.name, 60).length < 2) return { ok: false, error: "Store name is required." };
    if (!normalizeEmail(input.email)) return { ok: false, error: "Enter a valid contact email." };
    const patch: Record<string, unknown> = { name: clampStr(input.name, 60), blurb: clampStr(input.blurb, 300), phone: clampStr(input.phone, 20) || null,
      email: normalizeEmail(input.email), pickup_address: clampStr(input.pickupAddress, 300) || null };
    if (input.holidayMode !== undefined) patch.holiday_mode = input.holidayMode;
    if (input.logoUrl) patch.logo_url = input.logoUrl;
    if (input.bannerUrl) patch.banner_url = input.bannerUrl;
    const { error } = await (await createClient()).from("sellers").update(patch).eq("owner_id", actor.id);
    if (error) throw new Error(error.message);
    bust("/seller"); return { ok: true };
  });
}
export async function recordKycDocument(docType: "pan" | "gst" | "cancelled_cheque" | "address_proof", filePath: string): Promise<Result> {
  return guarded(["seller"], async (actor) => {
    const { data: s } = await (await createClient()).from("sellers").select("id").eq("owner_id", actor.id).maybeSingle();
    if (!s) return { ok: false, error: "Seller account not found." };
    const sid = (s as { id: string }).id;
    if (!filePath.startsWith(`${sid}/`)) return { ok: false, error: "Invalid file." };      // path must sit in the seller's own folder
    const { error } = await createAdminClient().from("seller_documents").insert({ seller_id: sid, doc_type: docType, file_path: filePath });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
}
export async function savePromotion(input: { id?: string; name: string; percent: number; scope: string; endsOn?: string }): Promise<Result<{ id: string }>> {
  return guarded(["seller"], async (actor) => {
    if (clampStr(input.name, 60).length < 3) return { ok: false, error: "Give your promotion a name." };
    if (!(input.percent >= 5 && input.percent <= 70)) return { ok: false, error: "Choose between 5% and 70%." };
    const supabase = await createClient();
    const me = await mySeller(supabase, actor.id);
    if (!me) return { ok: false, error: "Seller account not found." };
    if (me.status !== "active") return { ok: false, error: "Your store isn’t active." };
    if (!me.perms.run_promotions) return DENIED("Promotions");
    const s = { id: me.id };
    const row = { seller_id: (s as { id: string }).id, name: clampStr(input.name, 60), percent: Math.round(input.percent), scope: { all: input.scope === "all", label: input.scope }, ends_on: input.endsOn || null };
    const q = input.id && isUuid(input.id) ? supabase.from("promotions").update(row).eq("id", input.id).select("id").single() : supabase.from("promotions").insert(row).select("id").single();
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    bust("/seller"); return { ok: true, id: (data as { id: string }).id };
  });
}
export async function setPromotionActive(id: string, active: boolean): Promise<Result> {
  return guarded(["seller"], async (actor) => {
    const me = await mySeller(await createClient(), actor.id);
    if (!me || !me.perms.run_promotions) return DENIED("Promotions");
    const { error } = await (await createClient()).from("promotions").update({ active }).eq("id", id);
    if (error) throw new Error(error.message);
    bust("/seller"); return { ok: true };
  });
}
export async function createSupportTicket(input: { topic: string; message: string; orderNumber?: string }): Promise<Result<{ id: string }>> {
  return guarded(["seller", "customer"], async (actor) => {
    const msg = clampStr(input.message, 2000); if (!input.topic || msg.length < 10) return { ok: false, error: "Pick a topic and add a few details." };
    const supabase = await createClient();
    const { data: s } = actor.role === "seller" ? await supabase.from("sellers").select("id").eq("owner_id", actor.id).maybeSingle() : { data: null };
    const { data, error } = await supabase.from("support_tickets").insert({ user_id: actor.id, seller_id: (s as { id: string } | null)?.id ?? null, topic: clampStr(input.topic, 80), message: msg, order_number: clampStr(input.orderNumber, 20) || null }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: (data as { id: string }).id };
  });
}

/* ===================================================== seller registration */
/** Creates the seller's login (role is set server-side) + a PENDING store. An admin approves it before anything can be listed. */
export async function registerSeller(input: {
  store: string; owner: string; phone: string; email: string; password: string; city: string; categories: string[];
  pan: string; gstin?: string; ifsc: string; account: string; about: string; pickup: string;
}): Promise<Result<{ redirectTo: string }>> {
  if (!live()) return demoResult() as Result<{ redirectTo: string }>;
  try {
    const email = normalizeEmail(input.email), phone = normalizePhone(input.phone);
    const fe: string[] = [];
    if (!email) fe.push("a valid email"); if (!phone) fe.push("a valid mobile number"); if (nameError(input.owner)) fe.push("the owner’s name");
    if (clampStr(input.store, 60).length < 2) fe.push("a store name");
    const pw = passwordError(input.password); if (pw) return { ok: false, error: `Password: ${pw}` };
    if (fe.length) return { ok: false, error: `Please provide ${fe.join(", ")}.` };

    const ipKey = `seller-register:${(await clientIp()) ?? "unknown"}`;
    if ((await lockoutStatus(ipKey, 5, 60)).locked) return { ok: false, error: "Too many attempts. Please try again later." };
    await recordAttempt(ipKey, false);

    const admin = createAdminClient();
    const [{ data: byEmail }, { data: byStore }] = await Promise.all([
      admin.from("profiles").select("id").eq("email", email!).maybeSingle(),
      admin.from("sellers").select("id").eq("slug", slugify(input.store)).maybeSingle(),
    ]);
    if (byEmail) return { ok: false, error: "This email is already registered. Try signing in." };
    if (byStore) return { ok: false, error: "A store with that name already exists. Choose another name." };

    const { data: created, error } = await admin.auth.admin.createUser({
      email: email!, password: input.password, email_confirm: true,
      user_metadata: { full_name: input.owner.trim() }, app_metadata: { provisioned_by: "mana-server", role: "seller" },
    });
    if (error || !created.user) return { ok: false, error: "We couldn’t create your account. Please try again." };

    const { error: sErr } = await admin.from("sellers").insert({
      owner_id: created.user.id, slug: slugify(input.store), name: clampStr(input.store, 60), owner_name: clampStr(input.owner, 80), email, phone, city: clampStr(input.city, 60),
      pan: /^[A-Z]{5}\d{4}[A-Z]$/.test(input.pan) ? input.pan : null, gstin: input.gstin && /^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ[0-9A-Z]$/.test(input.gstin) ? input.gstin : null,
      bank_ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/.test(input.ifsc) ? input.ifsc : null, bank_account_last4: input.account.slice(-4), blurb: clampStr(input.about, 300), pickup_address: clampStr(input.pickup, 300),
    });
    if (sErr) { await admin.auth.admin.deleteUser(created.user.id); throw new Error(sErr.message); }
    await admin.from("notifications").insert({ audience: "admin", kind: "seller", title: "New seller application", body: `${input.store} (${input.city}) is waiting for review.` });

    const { error: inErr } = await (await createClient()).auth.signInWithPassword({ email: email!, password: input.password });
    return { ok: true, redirectTo: inErr ? "/seller/login" : "/seller" };
  } catch (e) { return fail(e) as Result<{ redirectTo: string }>; }
}
