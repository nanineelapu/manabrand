/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SUPABASE implementation of the data layer. Same function names and return shapes as ./mock.ts,
 * so pages never know which one they are reading from (see ./index.ts).
 *
 *  - pub()  → cookie-less client for public catalogue reads (cache/static friendly)
 *  - sb()   → client bound to the signed-in user's session; Row-Level Security decides what comes back
 */
import { HIDDEN_CATEGORY_SLUGS } from "@/lib/fashion";
import { mergePermissions } from "@/lib/permissions";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { analytics as mockAnalytics } from "@/lib/mock/ops";
import type {
  Address, AppNotification, Banner, Category, Collection, Coupon, Customer, Order, OrderStatus, Payout, Product,
  ProductStatus, ReturnRequest, Review, Seller,
} from "@/types";
import type { PhotoKind } from "@/lib/images";
import { discountPct, formatDate } from "@/lib/utils";
import type { ProductQuery } from "./mock";

const pub = () => createPublicClient();
const sb = () => createClient();

function ok<T>(r: { data: T | null; error: { message: string } | null }, fallback?: T): T {
  if (r.error) throw new Error(r.error.message);
  return (r.data ?? fallback) as T;
}
const uid = async () => (await (await sb()).auth.getUser()).data.user?.id ?? null;
const byOrder = (a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0);

/* ================================================================= mappers */
const PRODUCT_SELECT =
  "*, categories(slug), subcategories(name), product_colors(name, hex, sort), product_options(value, stock, sort), product_images(id, url, sort, is_cover)";

function mapProduct(r: any): Product {
  const colors = [...(r.product_colors ?? [])].sort(byOrder).map((c: any) => ({ name: c.name, hex: c.hex }));
  const opts = [...(r.product_options ?? [])].sort(byOrder);
  const imgRows = [...(r.product_images ?? [])].sort((a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.sort - b.sort);
  const images = imgRows.map((i: any) => i.url as string);
  return {
    id: r.id, slug: r.slug, name: r.name, sellerId: r.seller_id,
    categorySlug: r.categories?.slug ?? "", subcategory: r.subcategories?.name ?? "", photo: r.photo_kind as PhotoKind,
    price: r.price, mrp: r.mrp, colors: colors.length ? colors : [{ name: "Standard", hex: "#d9d3c7" }],
    optionLabel: r.option_label, sizes: opts.map((o: any) => o.value), stock: Object.fromEntries(opts.map((o: any) => [o.value, o.stock])),
    rating: Number(r.rating_avg), reviewCount: r.review_count, sold: r.sold_count, badges: r.badges ?? [],
    description: r.description, fabric: r.material, care: r.care ?? [], details: r.details ?? [], createdAt: r.created_at,
    status: r.status as ProductStatus, tags: r.tags ?? [], images, imageIds: imgRows.map((i: any) => i.id as string),
  };
}

const sellerToneDefault: [string, string] = ["#e9c46f", "#0e7a5f"];
function mapSeller(r: any, extra: { productCount?: number; rating?: number; totalSales?: number; followers?: number } = {}): Seller {
  return {
    id: r.id, slug: r.slug, name: r.name, owner: r.owner_name, city: r.city ?? "", state: r.state ?? "", email: r.email, phone: r.phone ?? "",
    joined: r.joined_at, status: r.status, rating: extra.rating ?? 0, followers: extra.followers ?? 0, productCount: extra.productCount ?? 0,
    totalSales: extra.totalSales ?? 0, commissionPct: Number(r.commission_pct), tone: [r.tone_from ?? sellerToneDefault[0], r.tone_to ?? sellerToneDefault[1]],
    blurb: r.blurb ?? "", kyc: r.kyc, gstin: r.gstin ?? "", logoUrl: r.logo_url ?? undefined, bannerUrl: r.banner_url ?? undefined,
    pickupAddress: r.pickup_address ?? undefined, holidayMode: r.holiday_mode, bankLast4: r.bank_account_last4 ?? undefined,
    permissions: mergePermissions(r.permissions),
  };
}

function mapOrder(r: any): Order {
  const items = (r.order_items ?? []).map((i: any) => ({
    productId: i.product_id, name: i.name, color: i.color ?? "", size: i.option_value, qty: i.qty, price: i.price, sellerId: i.seller_id,
    photo: i.photo_kind as PhotoKind, colorHex: i.color_hex ?? "#d9d3c7", image: i.image_url ?? undefined, itemId: i.id,
  }));
  const a = r.address ?? {};
  return {
    id: r.id, number: r.number, customerId: r.user_id, customerName: r.profiles?.full_name ?? a.name ?? "",
    items, status: r.status, subtotal: r.subtotal, discount: r.discount, shipping: (r.shipping_fee ?? 0) + (r.express_fee ?? 0) + (r.cod_fee ?? 0),
    total: r.total, payment: { method: r.payment_method, status: r.payment_status },
    address: { id: "", label: "Home", name: "", phone: "", line1: "", city: "", state: "", pincode: "", isDefault: false, ...a } as Address,
    createdAt: r.created_at,
    timeline: [...(r.order_events ?? [])].sort((x: any, y: any) => +new Date(x.created_at) - +new Date(y.created_at))
      .map((e: any) => ({ status: e.status as OrderStatus, at: e.created_at, note: e.note })),
    awb: r.awb ?? undefined, courier: r.courier ?? undefined, couponCode: r.coupon_code ?? undefined,
  };
}
const ORDER_SELECT = "*, order_items(*), order_events(status, note, created_at), profiles(full_name)";

function mapReturn(r: any): ReturnRequest {
  return {
    id: r.id, orderId: r.order_id, orderNumber: r.orders?.number ?? "", customerName: r.profiles?.full_name ?? "",
    item: r.order_items?.name ?? "", reason: r.reason, type: r.type, status: r.status, amount: r.amount, createdAt: r.created_at, sellerId: r.seller_id,
  };
}

const fmtPeriod = (a: string, b: string) => `${formatDate(a, { day: "numeric", month: "short" })} – ${formatDate(b, { day: "numeric", month: "short" })}`;
function mapPayout(r: any): Payout {
  return { id: r.id, sellerId: r.seller_id, sellerName: r.sellers?.name ?? "", period: fmtPeriod(r.period_start, r.period_end), orders: r.orders_count,
    gross: r.gross, commission: r.commission, net: r.net, status: r.status, date: r.paid_at ?? r.created_at, utr: r.utr ?? undefined };
}
function mapCoupon(r: any): Coupon {
  return { id: r.id, code: r.code, description: r.description, type: r.type, value: r.value, minOrder: r.min_order, maxDiscount: r.max_discount ?? undefined,
    used: r.used_count, limit: r.usage_limit, expires: r.expires_at ?? "", status: r.status };
}
function mapBanner(r: any): Banner {
  return { id: r.id, title: r.title, subtitle: r.subtitle, cta: r.cta, href: r.href, placement: r.placement, status: r.status,
    tone: ["#e4ebf3", "#2a5db0"], photo: (r.photo_kind ?? "dress") as PhotoKind, starts: r.starts_on ?? "", ends: r.ends_on ?? "" };
}
function mapReview(r: any): Review {
  return { id: r.id, productId: r.product_id, author: r.author_name ?? "Customer", city: r.author_city ?? "", rating: r.rating, title: r.title, body: r.body,
    date: r.created_at, verified: r.verified, helpful: r.helpful, status: r.status };
}

/* ================================================================ catalogue */
export async function getSellerNames(): Promise<Record<string, string>> {
  const rows = ok(await pub().from("sellers").select("id, name"), []) as any[];
  return Object.fromEntries(rows.map((s) => [s.id, s.name]));
}

async function categoryId(slug: string) {
  return (ok(await pub().from("categories").select("id").eq("slug", slug).maybeSingle()) as any)?.id as string | undefined;
}

export async function queryProducts(qy: ProductQuery = {}) {
  const db = pub();
  // ---- narrow by id sets (collection / sizes / colours / explicit ids)
  let idSet: string[] | null = qy.ids ? [...qy.ids] : null;
  const intersect = (ids: string[]) => { idSet = idSet ? idSet.filter((x) => ids.includes(x)) : ids; };
  const empty = { items: [] as Product[], total: 0, page: 1, pages: 1, facets: { sizes: [] as string[], optionLabel: "Options", colors: [] as { name: string; hex: string }[], sellers: [] as { id: string; name: string }[], priceMin: 0, priceMax: 0 } };

  if (qy.collection) {
    const c = ok(await db.from("collections").select("collection_products(product_id)").eq("slug", qy.collection).maybeSingle()) as any;
    intersect((c?.collection_products ?? []).map((x: any) => x.product_id));
  }
  if (qy.sizes?.length) intersect((ok(await db.from("product_options").select("product_id").in("value", qy.sizes).gt("stock", 0), []) as any[]).map((x) => x.product_id));
  if (qy.colors?.length) intersect((ok(await db.from("product_colors").select("product_id").in("name", qy.colors), []) as any[]).map((x) => x.product_id));
  if (idSet && idSet.length === 0) return empty;

  let groupIds: string[] | undefined;
  if (qy.group) {
    groupIds = (ok(await db.from("categories").select("id").like("slug", `${qy.group}-%`), []) as any[]).map((r) => r.id);
    if (!groupIds.length) return empty;
  }
  const catId = qy.category ? await categoryId(qy.category) : undefined;
  if (qy.category && !catId) return empty;
  let subId: string | undefined;
  if (qy.sub && catId) subId = (ok(await db.from("subcategories").select("id").eq("category_id", catId).ilike("name", qy.sub).maybeSingle()) as any)?.id;

  const terms = (qy.q ?? "").toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);
  const base = (q: any) => {
    q = q.eq("status", "active");
    if (catId) q = q.eq("category_id", catId);
    if (groupIds) q = q.in("category_id", groupIds);
    if (subId) q = q.eq("subcategory_id", subId);
    if (qy.badge) q = q.contains("badges", [qy.badge]);
    for (const t of terms) { const s = t.replace(/[%,()]/g, ""); q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%,tags.cs.{${s}}`); }
    return q;
  };
  const narrow = (q: any) => {
    if (idSet) q = q.in("id", idSet);
    if (qy.min !== undefined) q = q.gte("price", qy.min);
    if (qy.max !== undefined) q = q.lte("price", qy.max);
    if (qy.sellers?.length) q = q.in("seller_id", qy.sellers);
    if (qy.rating) q = q.gte("rating_avg", qy.rating);
    if (qy.discount) q = q.gte("discount_pct", qy.discount);
    return q;
  };

  const pageSize = qy.pageSize ?? 12, page = Math.max(1, qy.page ?? 1);
  let main = narrow(base(db.from("products").select(PRODUCT_SELECT, { count: "exact" })));
  switch (qy.sort) {
    case "new": main = main.order("created_at", { ascending: false }); break;
    case "price-asc": main = main.order("price", { ascending: true }); break;
    case "price-desc": main = main.order("price", { ascending: false }); break;
    case "rating": main = main.order("rating_avg", { ascending: false }).order("review_count", { ascending: false }); break;
    case "discount": main = main.order("discount_pct", { ascending: false }); break;
    default: main = main.order("sold_count", { ascending: false });
  }
  main = main.range((page - 1) * pageSize, page * pageSize - 1);

  const [{ data, count, error }, facetRes] = await Promise.all([
    main,
    base(db.from("products").select("seller_id, price, option_label, product_options(value), product_colors(name, hex)")).limit(1000),
  ]);
  if (error) throw new Error(error.message);
  const f = (facetRes.data ?? []) as any[];
  const sellerIds = [...new Set(f.map((x) => x.seller_id))] as string[];
  const sellerRows = sellerIds.length ? (ok(await db.from("sellers").select("id, name").in("id", sellerIds), []) as any[]) : [];
  const labels = [...new Set(f.map((x) => x.option_label))].filter((x) => x !== "Standard");
  const total = count ?? 0;
  return {
    items: (data ?? []).map(mapProduct), total, page, pages: Math.max(1, Math.ceil(total / pageSize)),
    facets: {
      sizes: qy.category || qy.group || qy.q ? [...new Set(f.flatMap((x) => (x.product_options ?? []).map((o: any) => o.value)))] as string[] : [],
      optionLabel: labels.length === 1 ? (labels[0] as string) : "Options",
      colors: qy.category || qy.group || qy.q ? [...new Map(f.flatMap((x) => x.product_colors ?? []).map((c: any) => [c.name, { name: c.name, hex: c.hex }])).values()] : [],
      sellers: sellerRows.map((s) => ({ id: s.id, name: s.name })),
      priceMin: f.length ? Math.min(...f.map((x) => x.price)) : 0, priceMax: f.length ? Math.max(...f.map((x) => x.price)) : 0,
    },
  };
}

export async function getCategories(): Promise<Category[]> {
  const db = pub();
  const [cats, counts] = await Promise.all([
    db.from("categories").select("*").order("sort"),
    db.from("products").select("category_id").eq("status", "active"),
  ]);
  const n: Record<string, number> = {};
  (counts.data ?? []).forEach((p: any) => { n[p.category_id] = (n[p.category_id] ?? 0) + 1; });
  return ok(cats, []).filter((c: any) => !HIDDEN_CATEGORY_SLUGS.has(c.slug)).map((c: any) => ({ id: c.id, slug: c.slug, name: c.name, tagline: c.tagline, tone: ["#e7efe9", "#9ec3b0"] as [string, string], photo: c.photo_kind as PhotoKind, productCount: n[c.id] ?? 0 }));
}
export const getCategory = async (slug: string) => (await getCategories()).find((c) => c.slug === slug);

export async function getSubcategoryMap(): Promise<Record<string, string[]>> {
  const rows = ok(await pub().from("subcategories").select("name, sort, categories(slug)").order("sort"), []) as any[];
  const out: Record<string, string[]> = {};
  rows.forEach((r) => { if (!HIDDEN_CATEGORY_SLUGS.has(r.categories.slug)) (out[r.categories.slug] ??= []).push(r.name); });
  return out;
}
export const getSubcategories = async (slug: string) => (await getSubcategoryMap())[slug] ?? [];

export async function getProduct(slug: string) {
  const r = ok(await pub().from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle());
  return r ? mapProduct(r) : undefined;
}
/** Session-aware: sellers/admins can open products that are still drafts or in review. */
export async function getProductById(id: string) {
  const r = ok(await (await sb()).from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle());
  return r ? mapProduct(r) : undefined;
}
export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  return (ok(await pub().from("products").select(PRODUCT_SELECT).in("id", ids), []) as any[]).map(mapProduct);
}
const listBy = async (col: string, asc: boolean, n: number, extra?: (q: any) => any) => {
  let q = pub().from("products").select(PRODUCT_SELECT).eq("status", "active");
  if (extra) q = extra(q);
  return (ok(await q.order(col, { ascending: asc }).limit(n), []) as any[]).map(mapProduct);
};
export const getNewArrivals = (n = 8) => listBy("created_at", false, n, (q) => q.contains("badges", ["new"]));
export const getTrending = (n = 8) => listBy("sold_count", false, n);
export const getOnSale = (n = 8) => listBy("discount_pct", false, n);
export async function getRelated(p: Product, n = 8) {
  const catId = await categoryId(p.categorySlug);
  if (!catId) return [];
  return listBy("sold_count", false, n, (q) => q.eq("category_id", catId).neq("id", p.id));
}

export async function getCollections(): Promise<Collection[]> {
  const rows = ok(await pub().from("collections").select("*, collection_products(product_id, sort)").order("sort"), []) as any[];
  return rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name, story: c.story, tone: ["#e4ebf3", "#2a5db0"] as [string, string], photo: c.photo_kind as PhotoKind,
    productIds: [...(c.collection_products ?? [])].sort(byOrder).map((x: any) => x.product_id) }));
}
export const getCollection = async (slug: string) => (await getCollections()).find((c) => c.slug === slug);

async function sellerStats(ids?: string[]) {
  let q = pub().from("products").select("seller_id, rating_avg, review_count, sold_count, price, status");
  if (ids) q = q.in("seller_id", ids);
  const rows = ok(await q, []) as any[];
  const f = ok(await pub().from("seller_follows").select("seller_id"), []) as any[];
  const stats: Record<string, { n: number; rating: number; w: number; sales: number; followers: number }> = {};
  rows.forEach((p) => {
    const s = (stats[p.seller_id] ??= { n: 0, rating: 0, w: 0, sales: 0, followers: 0 });
    s.n += 1; s.sales += p.sold_count * p.price;
    if (p.review_count > 0) { s.rating += Number(p.rating_avg) * p.review_count; s.w += p.review_count; }
  });
  f.forEach((x) => { (stats[x.seller_id] ??= { n: 0, rating: 0, w: 0, sales: 0, followers: 0 }).followers += 1; });
  return (id: string) => { const s = stats[id]; return { productCount: s?.n ?? 0, rating: s && s.w ? Math.round((s.rating / s.w) * 10) / 10 : 0, totalSales: s?.sales ?? 0, followers: s?.followers ?? 0 }; };
}
export async function getActiveSellers(): Promise<Seller[]> {
  const rows = ok(await pub().from("sellers").select("*").eq("status", "active").order("joined_at"), []) as any[];
  const stat = await sellerStats();
  return rows.map((r) => mapSeller(r, stat(r.id)));
}
export async function getSellerBySlug(slug: string) {
  const r = ok(await pub().from("sellers").select("*").eq("slug", slug).maybeSingle()) as any;
  return r ? mapSeller(r, (await sellerStats([r.id]))(r.id)) : undefined;
}
export async function getSellerById(id: string) {
  const r = ok(await (await sb()).from("sellers").select("*").eq("id", id).maybeSingle()) as any;
  return r ? mapSeller(r, (await sellerStats([r.id]))(r.id)) : undefined;
}

export async function getProductReviews(productId: string) {
  return (ok(await pub().from("reviews").select("*").eq("product_id", productId).eq("status", "published").order("created_at", { ascending: false }), []) as any[]).map(mapReview);
}
export async function ratingBreakdown(productId: string) {
  const rows = ok(await pub().from("reviews").select("rating").eq("product_id", productId).eq("status", "published"), []) as any[];
  return [5, 4, 3, 2, 1].map((star) => ({ star, count: rows.filter((r) => r.rating === star).length }));
}

export async function getHomeBanners() {
  return (ok(await pub().from("banners").select("*").eq("placement", "home-hero").order("starts_on"), []) as any[]).map(mapBanner);
}
export async function getStripBanner() {
  const r = ok(await pub().from("banners").select("*").eq("placement", "home-strip").limit(1).maybeSingle());
  return r ? mapBanner(r) : undefined;
}
export async function getCoupon(code: string) {
  const r = ok(await pub().from("coupons").select("*").ilike("code", code.trim()).maybeSingle());
  return r ? mapCoupon(r) : undefined;
}
export const getTrendingSearches = async () => ["Silk saree", "Kurta", "Oversized tee", "Cargo pants", "Lehenga", "Mom jeans"];

export async function getFollowState(sellerId: string) {
  const db = await sb(); const me = await uid();
  const [{ count }, mine] = await Promise.all([
    db.from("seller_follows").select("*", { count: "exact", head: true }).eq("seller_id", sellerId),
    me ? db.from("seller_follows").select("seller_id").eq("seller_id", sellerId).eq("user_id", me).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return { followers: count ?? 0, following: Boolean(mine.data) };
}

/* ============================================================ the shopper */
export async function getCurrentCustomer(): Promise<Customer> {
  const db = await sb(); const me = await uid();
  if (!me) throw new Error("Not signed in");
  const p = ok(await db.from("profiles").select("*").eq("id", me).single()) as any;
  const o = ok(await db.from("orders").select("total, status").eq("user_id", me), []) as any[];
  const live = o.filter((x) => x.status !== "cancelled");
  const spent = live.reduce((a, b) => a + b.total, 0);
  return { id: p.id, name: p.full_name, email: p.email, phone: p.phone ?? "", city: "", joined: p.created_at, orders: o.length, spent,
    status: p.status, tier: spent > 20000 ? "VIP" : o.length > 2 ? "Regular" : p.tier };
}
export async function getMyOrders() {
  const me = await uid(); if (!me) return [];
  return (ok(await (await sb()).from("orders").select(ORDER_SELECT).eq("user_id", me).order("created_at", { ascending: false }), []) as any[]).map(mapOrder);
}
export async function getOrderByIdOrNumber(key: string) {
  const col = /^[0-9a-f-]{36}$/i.test(key) ? "id" : "number";
  const r = ok(await (await sb()).from("orders").select(ORDER_SELECT).eq(col, key).maybeSingle());
  return r ? mapOrder(r) : undefined;
}
export async function getMyAddresses(): Promise<Address[]> {
  const me = await uid(); if (!me) return [];
  return (ok(await (await sb()).from("addresses").select("*").eq("user_id", me).order("is_default", { ascending: false }).order("created_at"), []) as any[])
    .map((a) => ({ id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, state: a.state, pincode: a.pincode, isDefault: a.is_default }));
}
const RETURN_SELECT = "*, orders(number), profiles(full_name), order_items(name)";
export async function getMyReturns() {
  const me = await uid(); if (!me) return [];
  return (ok(await (await sb()).from("returns").select(RETURN_SELECT).eq("user_id", me).order("created_at", { ascending: false }), []) as any[]).map(mapReturn);
}

/* =================================================================== admin */
export async function getAllOrders() {
  return (ok(await (await sb()).from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(500), []) as any[]).map(mapOrder);
}
export async function getAllCustomers(): Promise<Customer[]> {
  const db = await sb();
  const [p, o, a] = await Promise.all([
    db.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false }),
    db.from("orders").select("user_id, total, status"),
    db.from("addresses").select("user_id, city, is_default"),
  ]);
  const orders = (o.data ?? []) as any[], addr = (a.data ?? []) as any[];
  return ok(p, []).map((r: any) => {
    const mine = orders.filter((x) => x.user_id === r.id), live = mine.filter((x) => x.status !== "cancelled");
    const spent = live.reduce((s, x) => s + x.total, 0);
    return { id: r.id, name: r.full_name, email: r.email, phone: r.phone ?? "", city: addr.find((x) => x.user_id === r.id && x.is_default)?.city ?? addr.find((x) => x.user_id === r.id)?.city ?? "",
      joined: r.created_at, orders: mine.length, spent, status: r.status, tier: spent > 20000 ? "VIP" : mine.length > 2 ? "Regular" : r.tier } as Customer;
  });
}
export const getCustomerById = async (id: string) => (await getAllCustomers()).find((c) => c.id === id);
export async function getOrdersForCustomer(id: string) {
  return (ok(await (await sb()).from("orders").select(ORDER_SELECT).eq("user_id", id).order("created_at", { ascending: false }), []) as any[]).map(mapOrder);
}
export async function getAllSellers(): Promise<Seller[]> {
  const rows = ok(await (await sb()).from("sellers").select("*").order("joined_at", { ascending: false }), []) as any[];
  const stat = await sellerStats();
  return rows.map((r) => mapSeller(r, stat(r.id)));
}
export async function getAllProducts() {
  return (ok(await (await sb()).from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false }).limit(1000), []) as any[]).map(mapProduct);
}
export async function getAllPayouts() {
  return (ok(await (await sb()).from("payouts").select("*, sellers(name)").order("created_at", { ascending: false }), []) as any[]).map(mapPayout);
}
export async function getAllReturns() {
  return (ok(await (await sb()).from("returns").select(RETURN_SELECT).order("created_at", { ascending: false }), []) as any[]).map(mapReturn);
}
export async function getAllCoupons() {
  return (ok(await (await sb()).from("coupons").select("*").order("created_at", { ascending: false }), []) as any[]).map(mapCoupon);
}
export async function getAllBanners() {
  return (ok(await (await sb()).from("banners").select("*").order("starts_on", { ascending: false }), []) as any[]).map(mapBanner);
}
export async function getAllReviews() {
  return (ok(await (await sb()).from("reviews").select("*").order("created_at", { ascending: false }).limit(500), []) as any[]).map(mapReview);
}
export async function getNotifications(): Promise<AppNotification[]> {
  const rows = ok(await (await sb()).from("notifications").select("*").order("created_at", { ascending: false }).limit(20), []) as any[];
  return rows.map((n) => ({ id: n.id, title: n.title, body: n.body, at: n.created_at, kind: n.kind, read: n.read }));
}

export async function getAdminDashboard() {
  const db = await sb();
  const d = ok(await db.rpc("admin_dashboard")) as any;
  const [recent, low] = await Promise.all([
    db.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(6),
    getProductsByIds((d.lowStock ?? []).map((x: any) => x.id)),
  ]);
  return {
    revenue30: d.revenue30, orders30: d.orders30, visitors30: mockAnalytics.visitors.reduce((a, b) => a + b, 0), aov: d.aov,
    pendingOrders: d.pendingOrders, pendingSellers: d.pendingSellers, openReturns: d.openReturns, flaggedReviews: d.flaggedReviews,
    recentOrders: ((recent.data ?? []) as any[]).map(mapOrder),
    lowStock: (d.lowStock ?? []).map((x: any) => ({ product: low.find((p) => p.id === x.id)!, units: x.units })).filter((x: any) => x.product),
    topProducts: d.topProducts ?? [], topSellers: d.topSellers ?? [],
    statusCounts: (["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"] as OrderStatus[])
      .map((s) => ({ status: s, count: (d.statusCounts ?? []).find((x: any) => x.status === s)?.count ?? 0 })),
  };
}

/** Revenue + orders per day are REAL (from orders). Traffic, funnel and city split are sample data until an events table is added. */
export async function getAnalytics() {
  const d = ok(await (await sb()).rpc("admin_dashboard")) as any;
  const daily = (d.daily ?? []) as { day: string; revenue: number; orders: number }[];
  const weeks = [0, 1, 2, 3].map((i) => daily.slice(i * 7 + 2, i * 7 + 9));
  return {
    ...mockAnalytics, days: daily.map((x) => x.day), revenue: daily.map((x) => x.revenue), orders: daily.map((x) => x.orders),
    weeks: weeks.map((_, i) => `Wk ${i + 1}`), weeklyRevenue: weeks.map((w) => w.reduce((a, b) => a + b.revenue, 0)),
  };
}

/* ================================================================== seller */
export async function resolveSellerId(): Promise<string> {
  const me = await uid();
  const r = me ? ok(await (await sb()).from("sellers").select("id").eq("owner_id", me).maybeSingle()) as any : null;
  if (!r) throw new Error("No seller account for this user");
  return r.id;
}
export async function getCurrentSeller() {
  const me = await uid(); if (!me) return null;
  const r = ok(await (await sb()).from("sellers").select("*").eq("owner_id", me).maybeSingle()) as any;
  return r ? mapSeller(r, (await sellerStats([r.id]))(r.id)) : null;
}

export async function getOrdersForSeller(sellerId?: string): Promise<Order[]> {
  const id = sellerId ?? (await resolveSellerId());
  const db = await sb();
  const rows = ok(await db.from("seller_orders").select("*").eq("seller_id", id).order("created_at", { ascending: false }), []) as any[];
  const ids = [...new Set(rows.map((r) => r.order_id))];
  const events = ids.length ? (ok(await db.from("order_events").select("order_id, status, note, created_at").in("order_id", ids), []) as any[]) : [];
  const grouped = new Map<string, any[]>();
  rows.forEach((r) => grouped.set(r.order_id, [...(grouped.get(r.order_id) ?? []), r]));
  return [...grouped.values()].map((lines) => {
    const f = lines[0];
    const items = lines.map((i) => ({ productId: i.product_id, name: i.name, color: i.color ?? "", size: i.option_value, qty: i.qty, price: i.price, sellerId: i.seller_id,
      photo: i.photo_kind as PhotoKind, colorHex: i.color_hex ?? "#d9d3c7", image: i.image_url ?? undefined, itemId: i.item_id }));
    const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);
    return {
      id: f.order_id, number: f.number, customerId: f.user_id, customerName: f.customer_name, items, status: f.status, subtotal, discount: 0, shipping: 0, total: subtotal,
      payment: { method: f.payment_method, status: f.payment_status }, address: { id: "", label: "Home", isDefault: false, ...(f.address ?? {}) } as Address, createdAt: f.created_at,
      timeline: events.filter((e) => e.order_id === f.order_id).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)).map((e) => ({ status: e.status as OrderStatus, at: e.created_at, note: e.note })),
      awb: f.awb ?? undefined, courier: f.courier ?? undefined,
    } as Order;
  });
}
export async function getSellerProducts(sellerId?: string) {
  const id = sellerId ?? (await resolveSellerId());
  return (ok(await (await sb()).from("products").select(PRODUCT_SELECT).eq("seller_id", id).order("created_at", { ascending: false }), []) as any[]).map(mapProduct);
}
export async function getSellerPayouts(sellerId?: string) {
  const id = sellerId ?? (await resolveSellerId());
  return (ok(await (await sb()).from("payouts").select("*, sellers(name)").eq("seller_id", id).order("created_at", { ascending: false }), []) as any[]).map(mapPayout);
}
export async function getSellerReturns(sellerId?: string) {
  const id = sellerId ?? (await resolveSellerId());
  return (ok(await (await sb()).from("returns").select(RETURN_SELECT).eq("seller_id", id).order("created_at", { ascending: false }), []) as any[]).map(mapReturn);
}
export async function getSellerReviews(sellerId?: string) {
  const products = await getSellerProducts(sellerId);
  if (!products.length) return [];
  const rows = ok(await (await sb()).from("reviews").select("*").in("product_id", products.map((p) => p.id)).eq("status", "published").order("created_at", { ascending: false }), []) as any[];
  return rows.map(mapReview).map((r) => ({ ...r, productName: products.find((p) => p.id === r.productId)?.name ?? "" }));
}
export async function getSellerDashboard(sellerId?: string) {
  const id = sellerId ?? (await resolveSellerId());
  const [seller, d, orders, products] = await Promise.all([
    getSellerById(id), (async () => ok(await (await sb()).rpc("seller_dashboard", { p_seller: id })) as any)(), getOrdersForSeller(id), getSellerProducts(id),
  ]);
  const stock = (p: Product) => Object.values(p.stock).reduce((a, b) => a + b, 0);
  return {
    seller: seller!, toConfirm: d.toConfirm, toPack: d.toPack, toShip: d.toShip, todaySales: d.todaySales, weekSales: d.weekSales, monthSales: d.monthSales,
    recent: orders.slice(0, 5),
    lowStock: products.map((p) => ({ product: p, units: stock(p) })).filter((x) => x.units <= 30 && x.product.status !== "draft").sort((a, b) => a.units - b.units).slice(0, 5),
    bestSellers: [...products].sort((a, b) => b.sold - a.sold).slice(0, 4),
    pendingPayout: d.pendingPayout, returnsOpen: d.returnsOpen, weekly: d.weekly as { week: string; sales: number }[],
  };
}

export async function getSettings() {
  const rows = ok(await (await sb()).from("settings").select("key, value"), []) as { key: string; value: any }[];
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    shipping: { freeAbove: 9999999, standardFee: 99, expressFee: 149, codFee: 40, ...(m.shipping ?? {}) },
    payments: { upi: true, card: true, netbanking: true, cod: true, wallet: false, ...(m.payments ?? {}) },
    commission: { default: 12, ...(m.commission ?? {}) },
    business: { name: "ManaBrand Pvt. Ltd.", supportEmail: "care@manabrand.in", supportPhone: "+91 831 765 8309", ...(m.business ?? {}) },
  };
}
export async function getSellerPromotions() {
  const id = await resolveSellerId();
  const rows = ok(await (await sb()).from("promotions").select("*").eq("seller_id", id).order("id"), []) as any[];
  return rows.map((r) => ({ id: r.id, name: r.name, off: r.percent, scope: r.scope?.label ?? (r.scope?.all ? "All products" : "Selected products"), ends: r.ends_on ? formatDate(r.ends_on, { day: "numeric", month: "short" }) : "—", on: r.active, orders: 0 }));
}
export async function getSellerTickets() {
  const me = await uid();
  const rows = me ? (ok(await (await sb()).from("support_tickets").select("*").eq("user_id", me).order("created_at", { ascending: false }).limit(30), []) as any[]) : [];
  return rows.map((r) => ({ id: `T-${String(r.id).slice(0, 4).toUpperCase()}`, subject: r.topic, status: r.status === "open" ? "Open" : r.status === "in_progress" ? "In progress" : "Resolved", at: formatDate(r.created_at, { day: "numeric", month: "short" }) }));
}

void discountPct;
