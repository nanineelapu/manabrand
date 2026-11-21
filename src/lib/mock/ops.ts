import type {
  Address, AppNotification, Banner, Coupon, Customer, Order, OrderItem, OrderStatus, Payout,
  PaymentMethod, ReturnRequest, Review, TimelineEvent,
} from "@/types";
import { mulberry32, MOCK_NOW } from "@/lib/utils";
import { products, sellers } from "./catalog";

const rnd = mulberry32(2026);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const DAY = 86400000;
const iso = (ms: number) => new Date(ms).toISOString();

/* ============================================================ Customers */
const first = ["Ananya", "Rohan", "Isha", "Vikram", "Diya", "Aditya", "Kavya", "Rahul", "Sneha", "Arnav", "Tanya", "Karan", "Pooja", "Nikhil", "Riya", "Siddharth", "Meghna", "Yash", "Aarti", "Dev", "Nisha", "Harsh", "Simran", "Varun"];
const last = ["Sharma", "Verma", "Iyer", "Singh", "Patel", "Gupta", "Nair", "Mehta", "Reddy", "Kapoor", "Joshi", "Bose", "Khan", "Das", "Rao", "Malhotra"];
const cities: [string, string, string][] = [
  ["Ichapuram", "Andhra Pradesh", "532312"], ["Sompeta", "Andhra Pradesh", "532284"], ["Kaviti", "Andhra Pradesh", "532318"], ["Kanchili", "Andhra Pradesh", "532290"],
  ["Palasa", "Andhra Pradesh", "532221"], ["Mandasa", "Andhra Pradesh", "532242"], ["Tekkali", "Andhra Pradesh", "532201"],
];

export const customers: Customer[] = first.map((f, i) => {
  const orders = i === 0 ? 7 : Math.floor(rnd() * 9) + (i < 5 ? 4 : 0);
  const spent = orders * (900 + Math.floor(rnd() * 3200));
  const [city] = cities[i % cities.length];
  return {
    id: `u${i + 1}`, name: `${f} ${last[(i * 5) % last.length]}`,
    email: `${f.toLowerCase()}.${last[(i * 5) % last.length].toLowerCase()}@gmail.com`,
    phone: `+91 9${Math.floor(100000000 + rnd() * 899999999)}`, city,
    joined: iso(MOCK_NOW - (20 + Math.floor(rnd() * 420)) * DAY), orders, spent,
    status: i === 21 ? "blocked" : "active", tier: spent > 20000 ? "VIP" : orders > 2 ? "Regular" : "New",
  };
});
export const currentCustomer = customers[0]; // the logged-in storefront user in mock mode

/* ============================================================ Addresses */
export const addresses: Address[] = [
  { id: "a1", label: "Home", name: "Ananya Sharma", phone: "+91 98765 43210", line1: "Door No. 4-112, Main Road", line2: "Near Bus Stand", city: "Ichapuram", state: "Andhra Pradesh", pincode: "532312", isDefault: true },
  { id: "a2", label: "Work", name: "Ananya Sharma", phone: "+91 98765 43210", line1: "Shop 7, Market Street", line2: "Ichapuram Bazaar", city: "Ichapuram", state: "Andhra Pradesh", pincode: "532312", isDefault: false },
  { id: "a3", label: "Other", name: "Neha Sharma", phone: "+91 99870 11223", line1: "Gandhi Nagar, Beside Temple Road", city: "Sompeta", state: "Andhra Pradesh", pincode: "532284", isDefault: false },
];

/* =============================================================== Orders */
const statusFlow: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
const notes: Record<OrderStatus, string> = {
  placed: "Order placed successfully", confirmed: "Seller confirmed your order", packed: "Packed and ready for pickup",
  shipped: "Handed to courier partner", out_for_delivery: "Out for delivery today", delivered: "Delivered to you",
  cancelled: "Order cancelled", returned: "Return completed — refund initiated",
};
const couriers = ["ManaBrand Local Delivery", "Local courier partner"];
const methods: PaymentMethod[] = ["upi", "upi", "card", "cod", "netbanking", "wallet"];

function makeOrder(n: number, customerIdx: number, ageDays: number, status: OrderStatus): Order {
  const c = customers[customerIdx];
  const live = products.filter((p) => p.status === "active");
  const lines = 1 + Math.floor(rnd() * 3);
  const items: OrderItem[] = Array.from({ length: lines }, () => {
    const mine = live.filter((x) => x.sellerId === "s1");
    const p = rnd() < 0.4 ? pick(mine) : pick(live), col = pick(p.colors), size = pick(p.sizes);
    return { productId: p.id, name: p.name, color: col.name, colorHex: col.hex, size, qty: rnd() < 0.8 ? 1 : 2, price: p.price, sellerId: p.sellerId, photo: p.photo };
  });
  const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);
  const coupon = rnd() < 0.3;
  const discount = coupon ? Math.min(500, Math.round(subtotal * 0.1)) : 0;
  const shipping = 99;
  const total = subtotal - discount + shipping;
  const created = MOCK_NOW - ageDays * DAY - Math.floor(rnd() * 12) * 3600000;
  const method = pick(methods);

  const reached = status === "cancelled" ? ["placed"] : status === "returned" ? statusFlow : statusFlow.slice(0, statusFlow.indexOf(status) + 1);
  const timeline: TimelineEvent[] = reached.map((s, i) => ({ status: s as OrderStatus, at: iso(created + i * (14 * 3600000)), note: notes[s as OrderStatus] }));
  if (status === "cancelled") timeline.push({ status: "cancelled", at: iso(created + 5 * 3600000), note: notes.cancelled });
  if (status === "returned") timeline.push({ status: "returned", at: iso(created + 7 * DAY), note: notes.returned });
  const [city, state, pin] = cities[customerIdx % cities.length];
  const shipped = ["shipped", "out_for_delivery", "delivered", "returned"].includes(status);

  return {
    id: `o${n}`, number: `MB-${10400 + n}`, customerId: c.id, customerName: c.name, items, status,
    subtotal, discount, shipping, total,
    payment: { method, status: status === "cancelled" ? (method === "cod" ? "pending" : "refunded") : status === "returned" ? "refunded" : method === "cod" && status !== "delivered" ? "pending" : "paid" },
    address: { id: `ad${n}`, label: "Home", name: c.name, phone: c.phone, line1: `${10 + Math.floor(rnd() * 90)}, ${pick(["MG Road", "Park Street", "Station Road", "Lake View Apartments", "Rose Villa, 4th Cross"])}`, city, state, pincode: pin, isDefault: true },
    createdAt: iso(created), timeline, couponCode: coupon ? "WELCOME10" : undefined,
    awb: shipped ? `${Math.floor(1000000000 + rnd() * 8999999999)}` : undefined, courier: shipped ? pick(couriers) : undefined,
  };
}

const plan: [number, OrderStatus][] = [
  [0, "placed"], [0, "placed"], [0, "confirmed"], [1, "placed"], [1, "confirmed"], [1, "packed"], [1, "packed"], [2, "packed"], [2, "shipped"], [2, "shipped"],
  [3, "shipped"], [3, "out_for_delivery"], [3, "out_for_delivery"], [4, "delivered"], [4, "shipped"], [5, "delivered"], [6, "delivered"], [6, "cancelled"],
  [7, "delivered"], [8, "delivered"], [9, "delivered"], [10, "delivered"], [11, "returned"], [12, "delivered"], [13, "delivered"], [14, "cancelled"],
  [15, "delivered"], [17, "delivered"], [18, "delivered"], [19, "returned"], [21, "delivered"], [23, "delivered"], [25, "delivered"], [26, "delivered"],
  [28, "delivered"], [30, "delivered"], [33, "delivered"], [36, "delivered"], [40, "delivered"], [44, "delivered"],
];
export const orders: Order[] = plan.map(([age, st], i) => makeOrder(i + 82, (i < 14 && i % 3 === 0) || [13, 15, 16, 22].includes(i) ? 0 : 1 + Math.floor(rnd() * (customers.length - 1)), age, st));
// guarantee storefront customer's orders showcase every status
const showcase: [number, OrderStatus][] = [[1, "placed"], [3, "shipped"], [2, "out_for_delivery"], [18, "delivered"], [34, "delivered"], [24, "returned"], [30, "cancelled"]];
showcase.forEach(([age, st], i) => { orders.push(makeOrder(130 + i, 0, age, st)); });
orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

/* ============================================================== Returns */
const reasons = ["Doesn’t fit / wrong size", "Different from the photos", "Quality not as expected", "Received wrong item", "Arrived damaged", "Changed my mind"];
export const returns: ReturnRequest[] = orders
  .filter((o) => o.status === "returned" || o.status === "delivered")
  .slice(0, 9)
  .map((o, i) => ({
    id: `r${i + 1}`, orderId: o.id, orderNumber: o.number, customerName: o.customerName, item: o.items[0].name,
    reason: reasons[i % reasons.length], type: (["return", "exchange", "refund"] as const)[i % 3],
    status: o.status === "returned" ? "refunded" : (["requested", "approved", "picked_up", "requested", "rejected"] as const)[i % 5],
    amount: o.items[0].price * o.items[0].qty, createdAt: iso(MOCK_NOW - (i * 2 + 1) * DAY), sellerId: o.items[0].sellerId,
  }));

/* ============================================================== Coupons */
export const coupons: Coupon[] = [
  { id: "cp1", code: "WELCOME10", description: "10% off your first order", type: "percent", value: 10, minOrder: 999, maxDiscount: 500, used: 1284, limit: 5000, expires: "2026-12-31", status: "active" },
  { id: "cp2", code: "FESTIVE500", description: "Flat ₹500 off on ethnic wear", type: "flat", value: 500, minOrder: 2999, used: 642, limit: 2000, expires: "2026-11-30", status: "active" },
  { id: "cp3", code: "FREESHIP", description: "Free shipping on any order", type: "shipping", value: 0, minOrder: 499, used: 2210, limit: 10000, expires: "2026-12-15", status: "active" },
  { id: "cp4", code: "MANA20", description: "20% off for VIP members", type: "percent", value: 20, minOrder: 1999, maxDiscount: 1500, used: 188, limit: 500, expires: "2027-01-10", status: "scheduled" },
  { id: "cp5", code: "DIWALI25", description: "Diwali sale — 25% off", type: "percent", value: 25, minOrder: 1499, maxDiscount: 2000, used: 3980, limit: 4000, expires: "2026-11-02", status: "expired" },
  { id: "cp6", code: "SUMMER15", description: "Summer clearance 15% off", type: "percent", value: 15, minOrder: 799, used: 410, limit: 1500, expires: "2026-12-05", status: "paused" },
];

/* ============================================================== Banners */
export const banners: Banner[] = [
  { id: "b1", title: "The Wedding Edit", subtitle: "Silk sarees, jewellery & festive wear — up to 30% off", cta: "Shop the edit", href: "/collections/wedding-edit", placement: "home-hero", status: "live", tone: ["#f3e6e6", "#b13a26"], photo: "saree", starts: "2026-11-01", ends: "2026-12-10" },
  { id: "b2", title: "Street Style", subtitle: "Tees, shirts and denim for everyday menswear", cta: "Shop men", href: "/men", placement: "home-hero", status: "live", tone: ["#e4ebf3", "#2a5db0"], photo: "shirt", starts: "2026-11-01", ends: "2026-12-31" },
  { id: "b3", title: "The Summer Edit", subtitle: "Light dresses, easy tops and breezy shorts", cta: "Shop women", href: "/collections/summer-edit", placement: "home-hero", status: "live", tone: ["#efe9dc", "#0f6b52"], photo: "dress", starts: "2026-11-10", ends: "2026-12-31" },
  { id: "b4", title: "Delivery within 48 hours", subtitle: "Cash on delivery available", cta: "Shop now", href: "/shop", placement: "home-strip", status: "live", tone: ["#efe9dc", "#d0bd8a"], photo: "dress", starts: "2026-11-01", ends: "2026-12-31" },
  { id: "b5", title: "Winter Wardrobe Preview", subtitle: "Jackets & knits arriving soon", cta: "Get notified", href: "/new", placement: "home-hero", status: "scheduled", tone: ["#e4e8ef", "#6b7a99"], photo: "jacket", starts: "2026-12-01", ends: "2027-01-31" },
  { id: "b6", title: "Kurta Week", subtitle: "Up to 35% off kurtas and ethnic sets", cta: "Shop ethnic wear", href: "/category/women-ethnic-wear", placement: "category", status: "draft", tone: ["#efe6f3", "#8b6bb0"], photo: "kurta", starts: "2026-12-05", ends: "2026-12-12" },
];

/* ============================================================== Payouts */
export const payouts: Payout[] = sellers.filter((s) => s.status === "active").flatMap((s, si) =>
  ["Oct 16 – Oct 31", "Nov 1 – Nov 15", "Sep 16 – Sep 30"].map((period, i) => {
    const orders = 24 + Math.floor(rnd() * 60);
    const gross = orders * (1400 + Math.floor(rnd() * 2400));
    const commission = Math.round(gross * (s.commissionPct / 100));
    const status: Payout["status"] = i === 1 ? (si === 3 ? "on_hold" : "scheduled") : i === 0 ? (si === 1 ? "processing" : "paid") : "paid";
    return {
      id: `po-${s.id}-${i}`, sellerId: s.id, sellerName: s.name, period, orders, gross, commission, net: gross - commission, status,
      date: iso(MOCK_NOW - (i === 1 ? -3 : i === 0 ? 2 : 17) * DAY), utr: status === "paid" ? `HDFCR5${Math.floor(1e9 + rnd() * 8e9)}` : undefined,
    };
  }),
);

/* ============================================================== Reviews */
const rvTitles = ["Love it!", "Beautiful fabric", "Worth every rupee", "Fits perfectly", "Good, but runs slightly large", "Exactly as shown", "Gifted this — she loved it", "Comfortable all day", "Quality could be better", "Great festive buy"];
const rvBodies = [
  "The fabric feels premium and the stitching is neat. Colour is exactly like the photos.",
  "Delivered earlier than expected. Washed once and there was no fading at all.",
  "I'm 5'4\" and the size M fit perfectly. Will be ordering another colour.",
  "Lovely drape and very comfortable in the heat. Got a lot of compliments.",
  "Nice piece overall. The sleeves were a touch long for me but easy to alter.",
  "Packaging was lovely and the product matched the description. Happy with the purchase.",
];
export const reviews: Review[] = products.flatMap((p, pi) => {
  const n = 3 + (pi % 3);
  return Array.from({ length: n }, (_, k): Review => {
    const rating = ([5, 5, 4, 5, 4, 3] as const)[(pi + k) % 6];
    return {
      id: `rv${pi}-${k}`, productId: p.id, author: `${pick(first)} ${last[(pi + k) % last.length][0]}.`, city: pick(cities)[0], rating,
      title: rvTitles[(pi * 3 + k) % rvTitles.length], body: rvBodies[(pi + k * 2) % rvBodies.length],
      date: iso(MOCK_NOW - (2 + Math.floor(rnd() * 80)) * DAY), verified: rnd() < 0.85, helpful: Math.floor(rnd() * 40),
      status: pi === 4 && k === 0 ? "flagged" : pi % 7 === 0 && k === 0 ? "pending" : "published",
    };
  });
});

/* ======================================================== Notifications */
export const notifications: AppNotification[] = [
  { id: "n1", title: "New order MB-10482", body: "Ananya Sharma placed an order worth ₹3,498.", at: iso(MOCK_NOW - 12 * 60000), kind: "order", read: false },
  { id: "n2", title: "Low stock: Selvedge Straight Jeans", body: "Only 2 units left in size 32.", at: iso(MOCK_NOW - 55 * 60000), kind: "stock", read: false },
  { id: "n3", title: "Seller application", body: "Saanjh Studio submitted KYC documents for review.", at: iso(MOCK_NOW - 3 * 3600000), kind: "seller", read: false },
  { id: "n4", title: "Payout processed", body: "₹2,18,400 sent to Indigo Loom (UTR HDFCR5…).", at: iso(MOCK_NOW - 9 * 3600000), kind: "payout", read: true },
  { id: "n5", title: "Review flagged", body: "A review on Natural-dye Cotton Saree needs moderation.", at: iso(MOCK_NOW - 26 * 3600000), kind: "review", read: true },
  { id: "n6", title: "Return requested", body: "Rohan V. requested a return for Slim Fit Oxford Shirt.", at: iso(MOCK_NOW - 30 * 3600000), kind: "order", read: true },
];

/* =========================================================== Analytics */
const wave = (base: number, amp: number, n: number, seed: number) => {
  const r = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => Math.round(base + amp * Math.sin(i / 3.2) + (r() - 0.5) * amp * 0.9 + i * (base * 0.004)));
};
export const analytics = {
  days: Array.from({ length: 30 }, (_, i) => new Date(MOCK_NOW - (29 - i) * DAY).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })),
  revenue: wave(182000, 52000, 30, 11),
  orders: wave(96, 28, 30, 12),
  visitors: wave(5200, 1400, 30, 13),
  weeks: ["Wk 40", "Wk 41", "Wk 42", "Wk 43", "Wk 44", "Wk 45", "Wk 46"],
  weeklyRevenue: [1190000, 1260000, 1410000, 1320000, 1580000, 1730000, 1640000],
  traffic: [
    { label: "Instagram", value: 34 }, { label: "Google search", value: 26 }, { label: "Direct", value: 18 },
    { label: "WhatsApp", value: 13 }, { label: "Email", value: 9 },
  ],
  funnel: [
    { label: "Visits", value: 148200 }, { label: "Product views", value: 61400 }, { label: "Add to bag", value: 17900 },
    { label: "Checkout", value: 7400 }, { label: "Purchased", value: 4780 },
  ],
  topCities: [
    { label: "Ichapuram", value: 46.2 }, { label: "Sompeta", value: 14.1 }, { label: "Kaviti", value: 11.8 },
    { label: "Palasa–Kasibugga", value: 9.3 }, { label: "Kanchili", value: 7.4 }, { label: "Nearby villages", value: 5.2 },
  ],
};
