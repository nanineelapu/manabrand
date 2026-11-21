/** Domain models. These mirror the planned Supabase tables 1:1 (snake_case → camelCase). */

import type { PhotoKind } from "@/lib/images";
export type { PhotoKind };

export type ProductBadge = "new" | "bestseller" | "sale" | "limited";
export type ProductStatus = "active" | "draft" | "out_of_stock" | "pending_review";

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentSlug?: string;
  tagline: string;
  tone: [string, string]; // gradient pair for tiles
  photo: PhotoKind;
  productCount: number;
}

export interface ProductColor { name: string; hex: string }

export interface Product {
  id: string;
  slug: string;
  name: string;
  sellerId: string;
  categorySlug: string;
  subcategory: string;
  photo: PhotoKind;
  price: number; // INR
  mrp: number;
  colors: ProductColor[];
  /** Name of the variant option: "Size" | "Storage" | "Volume" | "Pack" | "Config" | "Standard" */
  optionLabel: string;
  sizes: string[];
  stock: Record<string, number>; // by option value
  rating: number;
  reviewCount: number;
  sold: number;
  badges: ProductBadge[];
  description: string;
  /** search-result title / description (leave empty to use the product name / description) */
  seoTitle?: string;
  seoDescription?: string;
  fabric: string;
  care: string[];
  details: string[];
  createdAt: string; // ISO
  status: ProductStatus;
  tags: string[];
  /** Uploaded photo URLs (Supabase Storage). Empty → fall back to the photo-kind stock set. */
  images: string[];
  /** product_images row ids, parallel to `images` (needed to remove a photo). */
  imageIds?: string[];
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpful: number;
  /** photos the customer attached (public URLs) */
  images?: string[];
  status: "published" | "pending" | "flagged";
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  story: string;
  tone: [string, string];
  photo: PhotoKind;
  productIds: string[];
}

export type SellerStatus = "active" | "pending" | "suspended" | "rejected";

/** Set by the admin per seller; see src/lib/permissions.ts. */
export interface SellerPermissions {
  add_products: boolean; publish_directly: boolean; manage_inventory: boolean; run_promotions: boolean; view_earnings: boolean;
}

export interface Seller {
  id: string;
  slug: string;
  name: string;
  owner: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  joined: string;
  status: SellerStatus;
  rating: number;
  followers: number;
  productCount: number;
  totalSales: number; // INR lifetime
  commissionPct: number;
  tone: [string, string];
  blurb: string;
  kyc: "verified" | "pending" | "rejected";
  gstin: string;
  logoUrl?: string;
  bannerUrl?: string;
  pickupAddress?: string;
  holidayMode?: boolean;
  bankLast4?: string;
  permissions: SellerPermissions;
}

export interface Address {
  id: string;
  label: "Home" | "Work" | "Other";
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joined: string;
  orders: number;
  spent: number;
  status: "active" | "blocked";
  tier: "New" | "Regular" | "VIP";
}

export type OrderStatus =
  | "placed" | "confirmed" | "packed" | "shipped" | "out_for_delivery"
  | "delivered" | "cancelled" | "returned";

export type PaymentMethod = "upi" | "card" | "cod" | "netbanking" | "wallet";

export interface OrderItem {
  productId: string;
  name: string;
  color: string;
  size: string;
  qty: number;
  price: number;
  sellerId: string;
  photo: PhotoKind;
  colorHex: string;
  image?: string;
  /** order_items.id (needed for returns) */
  itemId?: string;
}

export interface TimelineEvent { status: OrderStatus; at: string; note: string }

export interface Order {
  id: string;
  number: string; // MB-10482
  customerId: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: { method: PaymentMethod; status: "paid" | "pending" | "refunded" | "failed" };
  address: Address;
  createdAt: string;
  timeline: TimelineEvent[];
  awb?: string;
  courier?: string;
  couponCode?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  item: string;
  reason: string;
  type: "return" | "exchange" | "refund";
  status: "requested" | "approved" | "picked_up" | "refunded" | "rejected";
  amount: number;
  createdAt: string;
  sellerId: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "percent" | "flat" | "shipping";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  used: number;
  limit: number;
  expires: string;
  status: "active" | "scheduled" | "expired" | "paused";
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  placement: "home-hero" | "home-strip" | "category";
  status: "live" | "scheduled" | "draft";
  tone: [string, string];
  photo: PhotoKind;
  starts: string;
  ends: string;
}

export interface Payout {
  id: string;
  sellerId: string;
  sellerName: string;
  period: string;
  orders: number;
  gross: number;
  commission: number;
  net: number;
  status: "paid" | "processing" | "scheduled" | "on_hold";
  date: string;
  utr?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  kind: "order" | "stock" | "seller" | "payout" | "review" | "system";
  read: boolean;
}

export interface SortOption { value: string; label: string }
