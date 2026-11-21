import { catTitle } from "@/lib/fashion";
import type { Customer, Order, Product, ReturnRequest, Seller } from "@/types";

export type Range = "7" | "30" | "90" | "all";
export const RANGES: { id: Range; label: string }[] = [{ id: "7", label: "7 days" }, { id: "30", label: "30 days" }, { id: "90", label: "90 days" }, { id: "all", label: "All time" }];

const DAY = 86400000;
const sum = (a: number[]) => a.reduce((p, c) => p + c, 0);
const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0);
const top = <T,>(m: Map<string, T>, score: (v: T) => number, n: number) => [...m.entries()].sort((a, b) => score(b[1]) - score(a[1])).slice(0, n);

export interface Insight { tone: "good" | "warn" | "bad"; title: string; body: string }

/** Everything the "Business analysis" page shows, computed from real orders / products / sellers / customers / returns. */
export function analyse(input: { orders: Order[]; products: Product[]; sellers: Seller[]; customers: Customer[]; returns: ReturnRequest[]; range: Range; now?: number }) {
  const { products, sellers, customers, returns, range } = input;
  const now = input.now ?? Date.now();
  const since = range === "all" ? 0 : now - Number(range) * DAY;
  const prevFrom = range === "all" ? 0 : since - Number(range) * DAY;

  const inRange = input.orders.filter((o) => +new Date(o.createdAt) >= since);
  const prev = range === "all" ? [] : input.orders.filter((o) => { const t = +new Date(o.createdAt); return t >= prevFrom && t < since; });
  const booked = inRange.filter((o) => o.status !== "cancelled");
  const delivered = inRange.filter((o) => o.status === "delivered");
  const cancelled = inRange.filter((o) => o.status === "cancelled");

  const gross = sum(booked.map((o) => o.total));
  const prevGross = sum(prev.filter((o) => o.status !== "cancelled").map((o) => o.total));
  const growth = range === "all" || !prevGross ? undefined : ((gross - prevGross) / prevGross) * 100;
  const aov = booked.length ? gross / booked.length : 0;

  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  const productById = new Map(products.map((p) => [p.id, p]));

  // ---- line items: products, categories, sellers, commission
  const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
  const byCategory = new Map<string, number>();
  const bySub = new Map<string, number>();
  const bySeller = new Map<string, { revenue: number; orders: Set<string>; commission: number }>();
  let commission = 0;
  booked.forEach((o) => o.items.forEach((it) => {
    const line = it.price * it.qty;
    const p = byProduct.get(it.productId) ?? { name: it.name, units: 0, revenue: 0 };
    p.units += it.qty; p.revenue += line; byProduct.set(it.productId, p);
    const prod = productById.get(it.productId);
    if (prod) {
      byCategory.set(prod.categorySlug, (byCategory.get(prod.categorySlug) ?? 0) + line);
      bySub.set(prod.subcategory, (bySub.get(prod.subcategory) ?? 0) + line);
    }
    const s = sellerById.get(it.sellerId);
    const cut = s ? (line * s.commissionPct) / 100 : 0;
    commission += cut;
    const row = bySeller.get(it.sellerId) ?? { revenue: 0, orders: new Set<string>(), commission: 0 };
    row.revenue += line; row.orders.add(o.id); row.commission += cut; bySeller.set(it.sellerId, row);
  }));

  // ---- daily revenue
  const spanDays = range === "all" ? 30 : Number(range);
  const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
  const dayRev = new Map<string, number>();
  const dayOrd = new Map<string, number>();
  booked.forEach((o) => { const k = dayKey(+new Date(o.createdAt)); dayRev.set(k, (dayRev.get(k) ?? 0) + o.total); dayOrd.set(k, (dayOrd.get(k) ?? 0) + 1); });
  const days = Array.from({ length: spanDays }, (_, i) => dayKey(now - (spanDays - 1 - i) * DAY));
  const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

  // ---- payments + statuses
  const pay = new Map<string, number>();
  booked.forEach((o) => pay.set(o.payment.method, (pay.get(o.payment.method) ?? 0) + 1));
  const statusCount = new Map<string, number>();
  inRange.forEach((o) => statusCount.set(o.status, (statusCount.get(o.status) ?? 0) + 1));

  // ---- customers (lifetime, so "repeat" is meaningful)
  const perCustomer = new Map<string, number>();
  input.orders.filter((o) => o.status !== "cancelled").forEach((o) => perCustomer.set(o.customerId, (perCustomer.get(o.customerId) ?? 0) + 1));
  const buyers = perCustomer.size;
  const repeat = [...perCustomer.values()].filter((n) => n >= 2).length;
  const newInRange = customers.filter((c) => +new Date(c.joined) >= since).length;
  const topCustomers = [...customers].sort((a, b) => b.spent - a.spent).slice(0, 5);

  // ---- fulfilment speed (placed → delivered)
  const hours = delivered.flatMap((o) => {
    const a = o.timeline.find((e) => e.status === "placed")?.at ?? o.createdAt;
    const b = o.timeline.find((e) => e.status === "delivered")?.at;
    return b ? [(+new Date(b) - +new Date(a)) / 3600000] : [];
  });
  const avgDeliveryDays = hours.length ? sum(hours) / hours.length / 24 : 0;

  // ---- returns
  const rets = returns.filter((r) => +new Date(r.createdAt) >= since);
  const reasons = new Map<string, number>();
  rets.forEach((r) => reasons.set(r.reason, (reasons.get(r.reason) ?? 0) + 1));

  // ---- inventory
  const stockOf = (p: Product) => sum(Object.values(p.stock));
  const live = products.filter((p) => p.status === "active");
  const lowStock = live.filter((p) => { const s = stockOf(p); return s > 0 && s <= 5; });
  const outOfStock = products.filter((p) => p.status === "out_of_stock" || (p.status === "active" && stockOf(p) === 0));
  const soldIds = new Set(booked.flatMap((o) => o.items.map((i) => i.productId)));
  const noSales = live.filter((p) => !soldIds.has(p.id));
  const pendingReview = products.filter((p) => p.status === "pending_review").length;
  const discountDepth = live.length ? sum(live.map((p) => (p.mrp > 0 ? ((p.mrp - p.price) / p.mrp) * 100 : 0))) / live.length : 0;

  const cancelRate = pct(cancelled.length, inRange.length);
  const codShare = pct(pay.get("cod") ?? 0, booked.length);
  const returnRate = pct(rets.length, booked.length);
  const repeatRate = pct(repeat, buyers);
  const topSeller = top(bySeller, (v) => v.revenue, 1)[0];
  const topSellerShare = topSeller ? pct(topSeller[1].revenue, gross) : 0;

  // ---- plain-language read-out
  const insights: Insight[] = [];
  if (!booked.length) insights.push({ tone: "warn", title: "No orders in this period", body: "Try a longer range, or push traffic with a coupon or a homepage banner." });
  if (cancelRate > 8) insights.push({ tone: "bad", title: `Cancellations are ${cancelRate.toFixed(1)}%`, body: "Healthy is under 5%. Confirm COD orders by phone and keep stock counts accurate." });
  else if (inRange.length) insights.push({ tone: "good", title: `Cancellations are low (${cancelRate.toFixed(1)}%)`, body: "Orders are sticking once placed." });
  if (codShare > 60) insights.push({ tone: "warn", title: `${codShare.toFixed(0)}% of orders are cash on delivery`, body: "COD has higher returns and refusals. Once online payments are live, offer a small UPI discount." });
  if (buyers >= 5 && repeatRate < 20) insights.push({ tone: "warn", title: `Only ${repeatRate.toFixed(0)}% of buyers have ordered twice`, body: "Fashion lives on repeat buyers. Use the Mana Deal Box, a second-order coupon and new-arrival emails." });
  if (topSellerShare > 50) insights.push({ tone: "warn", title: `${topSeller ? sellerById.get(topSeller[0])?.name ?? "One seller" : "One seller"} drives ${topSellerShare.toFixed(0)}% of sales`, body: "Onboard more sellers in the categories where it is thin, so the marketplace does not depend on one shop." });
  if (outOfStock.length) insights.push({ tone: "bad", title: `${outOfStock.length} product${outOfStock.length > 1 ? "s are" : " is"} out of stock`, body: "Ask the sellers to restock, or hide the listings so customers do not hit dead ends." });
  if (lowStock.length) insights.push({ tone: "warn", title: `${lowStock.length} product${lowStock.length > 1 ? "s are" : " is"} almost out of stock`, body: "5 or fewer units left in total. Best-sellers first." });
  if (noSales.length && booked.length) insights.push({ tone: "warn", title: `${noSales.length} live products had no sales`, body: "Improve their photos and titles, feature them on a collection, or mark them down." });
  if (pendingReview) insights.push({ tone: "warn", title: `${pendingReview} product${pendingReview > 1 ? "s are" : " is"} waiting for your review`, body: "Sellers cannot sell them until you approve." });
  if (returnRate > 10) insights.push({ tone: "bad", title: `Return rate is ${returnRate.toFixed(1)}%`, body: "Check the top return reasons below. Size guidance and better photos usually fix fashion returns." });

  return {
    gross, growth, aov, commission, orders: booked.length, deliveredRevenue: sum(delivered.map((o) => o.total)), cancelled: cancelled.length,
    cancelRate, codShare, returnRate, repeatRate, buyers, repeat, newCustomers: newInRange, avgDeliveryDays, discountDepth, returnsCount: rets.length,
    daily: { labels: days.map((d) => fmt.format(new Date(d))), revenue: days.map((d) => dayRev.get(d) ?? 0), orders: days.map((d) => dayOrd.get(d) ?? 0) },
    topProducts: top(byProduct, (v) => v.revenue, 6).map(([id, v]) => ({ id, ...v })),
    categories: [...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([slug, value]) => ({ label: catTitle(slug), value })),
    subcategories: [...bySub.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value })),
    sellers: top(bySeller, (v) => v.revenue, 6).map(([id, v]) => ({ id, name: sellerById.get(id)?.name ?? "Seller", revenue: v.revenue, orders: v.orders.size, commission: v.commission })),
    payments: [...pay.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label: label === "cod" ? "Cash on delivery" : label.toUpperCase() === "UPI" ? "UPI" : label.charAt(0).toUpperCase() + label.slice(1), value })),
    statuses: [...statusCount.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label: label.replace(/_/g, " "), value })),
    returnReasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value })),
    topCustomers,
    inventory: { live: live.length, drafts: products.filter((p) => p.status === "draft").length, pendingReview, outOfStock: outOfStock.length, low: lowStock.slice(0, 6).map((p) => ({ id: p.id, name: p.name, left: stockOf(p) })), noSales: noSales.length },
    insights,
  };
}
