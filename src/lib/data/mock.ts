/**
 * DATA ACCESS LAYER — the Supabase seam.
 * Every page reads through these async functions. Today they resolve from
 * src/lib/mock; in Phase 7 each body becomes a Supabase query with the same
 * signature, and no UI file changes.
 */
import type { Order, OrderStatus, Product } from "@/types";
import {
  categories, collections, products, sellers, subcategories, sellerById, productById,
} from "@/lib/mock/catalog";
import {
  addresses, analytics, banners, coupons, currentCustomer, customers, notifications, orders, payouts, returns, reviews,
} from "@/lib/mock/ops";
import { discountPct, MOCK_NOW, sumBy } from "@/lib/utils";

export const CURRENT_SELLER_ID = "s1";

/* ------------------------------------------------------------ Catalogue */
export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer rating" },
  { value: "discount", label: "Better discount" },
] as const;

export interface ProductQuery {
  category?: string; sub?: string; q?: string; sort?: string; min?: number; max?: number;
  sizes?: string[]; colors?: string[]; sellers?: string[]; rating?: number; discount?: number;
  collection?: string; badge?: string; page?: number; pageSize?: number; ids?: string[];
}

const live = () => products.filter((p) => p.status === "active");

export async function queryProducts(qy: ProductQuery = {}) {
  let list = live();
  if (qy.ids) list = list.filter((p) => qy.ids!.includes(p.id));
  if (qy.category) list = list.filter((p) => p.categorySlug === qy.category);
  if (qy.sub) list = list.filter((p) => p.subcategory.toLowerCase() === qy.sub!.toLowerCase());
  if (qy.collection) { const c = collections.find((x) => x.slug === qy.collection); list = list.filter((p) => c?.productIds.includes(p.id)); }
  if (qy.badge) list = list.filter((p) => p.badges.includes(qy.badge as never));
  if (qy.q) {
    const t = qy.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((p) => { const hay = `${p.name} ${p.subcategory} ${p.categorySlug} ${p.tags.join(" ")} ${sellerById(p.sellerId)?.name ?? ""}`.toLowerCase(); return t.every((w) => hay.includes(w)); });
  }
  const facetBase = list; // facets computed before price/size/colour narrowing
  if (qy.min !== undefined) list = list.filter((p) => p.price >= qy.min!);
  if (qy.max !== undefined) list = list.filter((p) => p.price <= qy.max!);
  if (qy.sizes?.length) list = list.filter((p) => p.sizes.some((s) => qy.sizes!.includes(s) && p.stock[s] > 0));
  if (qy.colors?.length) list = list.filter((p) => p.colors.some((c) => qy.colors!.includes(c.name)));
  if (qy.sellers?.length) list = list.filter((p) => qy.sellers!.includes(p.sellerId));
  if (qy.rating) list = list.filter((p) => p.rating >= qy.rating!);
  if (qy.discount) list = list.filter((p) => discountPct(p.price, p.mrp) >= qy.discount!);

  const sorted = [...list];
  switch (qy.sort) {
    case "new": sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
    case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
    case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
    case "rating": sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount); break;
    case "discount": sorted.sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp)); break;
    default: sorted.sort((a, b) => b.sold - a.sold);
  }
  const pageSize = qy.pageSize ?? 12, page = Math.max(1, qy.page ?? 1);
  const total = sorted.length;
  const facets = {
    // option chips (size / storage / volume…) only make sense inside one category
    sizes: qy.category || qy.q ? [...new Set(facetBase.flatMap((p) => p.sizes))] : [],
    optionLabel: (() => { const l = [...new Set(facetBase.map((p) => p.optionLabel))].filter((x) => x !== "Standard"); return l.length === 1 ? l[0] : "Options"; })(),
    colors: qy.category || qy.q ? [...new Map(facetBase.flatMap((p) => p.colors).map((c) => [c.name, c])).values()] : [],
    sellers: [...new Set(facetBase.map((p) => p.sellerId))].map((id) => sellerById(id)!).filter(Boolean).map((s) => ({ id: s.id, name: s.name })),
    priceMin: Math.min(...facetBase.map((p) => p.price), 0),
    priceMax: Math.max(...facetBase.map((p) => p.price), 0),
  };
  return { items: sorted.slice((page - 1) * pageSize, page * pageSize), total, page, pages: Math.max(1, Math.ceil(total / pageSize)), facets };
}

export const getCategories = async () => categories;
export const getCategory = async (slug: string) => categories.find((c) => c.slug === slug);
export const getSubcategories = async (slug: string) => subcategories[slug] ?? [];
export const getProduct = async (slug: string) => products.find((p) => p.slug === slug);
export const getProductById = async (id: string) => productById(id);
export const getProductsByIds = async (ids: string[]) => ids.map((id) => productById(id)).filter(Boolean) as Product[];
export const getNewArrivals = async (n = 8) => [...live()].filter((p) => p.badges.includes("new")).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, n);
export const getTrending = async (n = 8) => [...live()].sort((a, b) => b.sold - a.sold).slice(0, n);
export const getOnSale = async (n = 8) => [...live()].sort((a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp)).slice(0, n);
export const getRelated = async (p: Product, n = 8) =>
  live().filter((x) => x.id !== p.id && (x.categorySlug === p.categorySlug || x.subcategory === p.subcategory)).slice(0, n);
export const getCollections = async () => collections;
export const getCollection = async (slug: string) => collections.find((c) => c.slug === slug);
export const getActiveSellers = async () => sellers.filter((s) => s.status === "active");
export const getSellerBySlug = async (slug: string) => sellers.find((s) => s.slug === slug);
export const getSellerById = async (id: string) => sellerById(id);
export const getProductReviews = async (productId: string) => reviews.filter((r) => r.productId === productId && r.status === "published");
export const getHomeBanners = async () => banners.filter((b) => b.placement === "home-hero" && b.status === "live");
export const getStripBanner = async () => banners.find((b) => b.placement === "home-strip" && b.status === "live");
export const getCoupon = async (code: string) => coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
export const getTrendingSearches = async () => ["Wireless earbuds", "Silk saree", "Sneakers", "Smart watch", "Sofa", "Vitamin C serum"];

export async function ratingBreakdown(productId: string) {
  const r = reviews.filter((x) => x.productId === productId);
  return [5, 4, 3, 2, 1].map((s) => ({ star: s, count: r.filter((x) => x.rating === s).length }));
}

/* --------------------------------------------------------------- Account */
export const getCurrentCustomer = async () => currentCustomer;
// Demo mode has no signed-in shopper, so the customer-facing lists are empty (no invented orders or addresses).
export const getMyOrders = async () => [] as typeof orders;
export const getOrderByIdOrNumber = async (key: string) => orders.find((o) => o.id === key || o.number === key);
export const getMyAddresses = async () => [] as typeof addresses;
export const getMyReturns = async () => [] as typeof returns;

/* ----------------------------------------------------------------- Admin */
export async function getAdminDashboard() {
  const paid = orders.filter((o) => o.status !== "cancelled");
  const revenue30 = sumBy(analytics.revenue, (n) => n);
  return {
    revenue30, orders30: sumBy(analytics.orders, (n) => n), visitors30: sumBy(analytics.visitors, (n) => n),
    aov: Math.round(sumBy(paid, (o) => o.total) / Math.max(1, paid.length)),
    pendingOrders: orders.filter((o) => ["placed", "confirmed"].includes(o.status)).length,
    pendingSellers: sellers.filter((s) => s.status === "pending").length,
    openReturns: returns.filter((r) => r.status === "requested").length,
    flaggedReviews: reviews.filter((r) => r.status !== "published").length,
    recentOrders: orders.slice(0, 6),
    lowStock: products.filter((p) => p.status !== "draft" && Object.values(p.stock).reduce((a, b) => a + b, 0) <= 12)
      .map((p) => ({ product: p, units: Object.values(p.stock).reduce((a, b) => a + b, 0) })).slice(0, 5),
    topProducts: [...products].sort((a, b) => b.sold * b.price - a.sold * a.price).slice(0, 5).map((p) => ({ label: p.name, value: p.sold * p.price, sub: `${p.sold} sold` })),
    topSellers: [...sellers].filter((s) => s.status === "active").sort((a, b) => b.totalSales - a.totalSales).slice(0, 5).map((s) => ({ label: s.name, value: s.totalSales, sub: `${s.city} · ${s.productCount} products` })),
    statusCounts: (["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"] as OrderStatus[]).map((s) => ({ status: s, count: orders.filter((o) => o.status === s).length })),
  };
}
export const getAllOrders = async () => orders;
export const getAllCustomers = async () => customers;
export const getCustomerById = async (id: string) => customers.find((c) => c.id === id);
export const getOrdersForCustomer = async (id: string) => orders.filter((o) => o.customerId === id);
export const getAllSellers = async () => sellers;
export const getAllProducts = async () => products;
export const getAllPayouts = async () => payouts;
export const getAllReturns = async () => returns;
export const getAllCoupons = async () => coupons;
export const getAllBanners = async () => banners;
export const getAllReviews = async () => reviews;
export const getAnalytics = async () => analytics;
export const getNotifications = async () => notifications;
export const getOrdersForSeller = async (sellerId: string = CURRENT_SELLER_ID): Promise<Order[]> =>
  orders.filter((o) => o.items.some((i) => i.sellerId === sellerId)).map((o) => {
    // A seller only sees (and is paid for) their own lines of a multi-seller order.
    const items = o.items.filter((i) => i.sellerId === sellerId);
    const subtotal = sumBy(items, (i) => i.price * i.qty);
    return { ...o, items, subtotal, discount: 0, shipping: 0, total: subtotal };
  });

/* ---------------------------------------------------------------- Seller */
export async function getSellerDashboard(sellerId = CURRENT_SELLER_ID) {
  const myOrders = await getOrdersForSeller(sellerId);
  const myProducts = products.filter((p) => p.sellerId === sellerId);
  const sub = (o: Order) => sumBy(o.items, (i) => i.price * i.qty);
  const today = myOrders.filter((o) => MOCK_NOW - +new Date(o.createdAt) < 86400000 * 2);
  return {
    seller: sellerById(sellerId)!,
    toConfirm: myOrders.filter((o) => o.status === "placed").length,
    toPack: myOrders.filter((o) => o.status === "confirmed").length,
    toShip: myOrders.filter((o) => o.status === "packed").length,
    todaySales: sumBy(today, sub),
    weekSales: sumBy(myOrders.filter((o) => MOCK_NOW - +new Date(o.createdAt) < 7 * 86400000 && o.status !== "cancelled"), sub),
    monthSales: sumBy(myOrders.filter((o) => o.status !== "cancelled"), sub),
    recent: myOrders.slice(0, 5),
    lowStock: myProducts.map((p) => ({ product: p, units: Object.values(p.stock).reduce((a, b) => a + b, 0) })).filter((x) => x.units <= 30).sort((a, b) => a.units - b.units).slice(0, 5),
    bestSellers: [...myProducts].sort((a, b) => b.sold - a.sold).slice(0, 4),
    weekly: analytics.weeks.map((w, i) => ({ week: w, sales: Math.round(analytics.weeklyRevenue[i] * 0.085) })),
    pendingPayout: payouts.filter((p) => p.sellerId === sellerId && ["scheduled", "processing"].includes(p.status)).reduce((a, b) => a + b.net, 0),
    returnsOpen: returns.filter((r) => r.sellerId === sellerId && r.status === "requested").length,
  };
}
export const getSellerProducts = async (sellerId = CURRENT_SELLER_ID) => products.filter((p) => p.sellerId === sellerId);
export const getSellerPayouts = async (sellerId = CURRENT_SELLER_ID) => payouts.filter((p) => p.sellerId === sellerId);
export const getSellerReturns = async (sellerId = CURRENT_SELLER_ID) => returns.filter((r) => r.sellerId === sellerId);
export const getSellerReviews = async (sellerId = CURRENT_SELLER_ID) => {
  const ids = products.filter((p) => p.sellerId === sellerId).map((p) => p.id);
  return reviews.filter((r) => ids.includes(r.productId) && r.status === "published").map((r) => ({ ...r, productName: productById(r.productId)?.name ?? "" }));
};

export interface SettingsData {
  shipping: { freeAbove: number; standardFee: number; expressFee: number; codFee: number };
  payments: Record<string, boolean>; commission: { default: number };
  business: { name: string; supportEmail: string; supportPhone: string; gstin?: string };
}
export interface PromoRow { id: string; name: string; off: number; scope: string; ends: string; on: boolean; orders: number }
export interface TicketRow { id: string; subject: string; status: string; at: string }

export const getSettings = async (): Promise<SettingsData> => ({
  shipping: { freeAbove: 1499, standardFee: 99, expressFee: 149, codFee: 40 }, payments: { upi: true, card: true, netbanking: true, cod: true, wallet: false },
  commission: { default: 12 }, business: { name: "ManaBrand Pvt. Ltd.", supportEmail: "care@manabrand.in", supportPhone: "+91 831 765 8309", gstin: "27AABCM1234P1Z9" },
});
export const getSellerPromotions = async (): Promise<PromoRow[]> => [
  { id: "p1", name: "Festive cottons", off: 15, scope: "Everyday Cotton (5 products)", ends: "30 Nov", on: true, orders: 64 },
  { id: "p2", name: "Weekend flash sale", off: 25, scope: "Hand-block Kurta Set", ends: "16 Nov", on: true, orders: 21 },
  { id: "p3", name: "Buy 2 save more", off: 10, scope: "All kurtas", ends: "—", on: false, orders: 0 },
];
export const getSellerTickets = async (): Promise<TicketRow[]> => [
  { id: "T-2041", subject: "Payout for 16–31 Oct not received", status: "In progress", at: "2 days ago" },
  { id: "T-1987", subject: "Change pickup address", status: "Resolved", at: "2 weeks ago" },
];

/* ------------------------------------------------- shared helpers (same API as supabase.ts) */
export const getSubcategoryMap = async () => subcategories;
/** Which seller the signed-in seller is. Demo mode: the first mock seller. */
export const resolveSellerId = async () => CURRENT_SELLER_ID;
export const getCurrentSeller = async () => sellerById(CURRENT_SELLER_ID) ?? null;
export const getFollowState = async (_sellerId: string) => ({ followers: sellerById(_sellerId)?.followers ?? 0, following: false });

export const getSellerNames = async () => Object.fromEntries(sellers.map((s) => [s.id, s.name]));
