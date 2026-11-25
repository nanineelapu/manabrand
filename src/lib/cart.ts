import type { CartLine } from "@/lib/stores";
import type { CouponLite, ProductLite } from "@/components/store/store-data";

/** Free delivery by order value is switched off (the value is never reached). Keep in step with settings.shipping.freeAbove. */
export const FREE_SHIPPING_AT = 9_999_999;
export const SHIPPING_FEE = 99;
export const COD_FEE = 40;

export interface PricedLine extends CartLine { product: ProductLite; colorHex: string; lineTotal: number; lineMrp: number }

export function priceCart(lines: CartLine[], byId: Map<string, ProductLite>, coupons: CouponLite[], couponCode: string | null) {
  const priced: PricedLine[] = lines.flatMap((l) => {
    const product = byId.get(l.productId);
    if (!product) return [];
    const colorHex = product.colors?.find((c) => c.name === l.color)?.hex ?? product.colors?.[0]?.hex ?? "#d9d3c7";
    return [{ ...l, product, colorHex, lineTotal: product.price * l.qty, lineMrp: product.mrp * l.qty }];
  });
  const subtotal = priced.reduce((a, b) => a + b.lineTotal, 0);
  const mrpTotal = priced.reduce((a, b) => a + b.lineMrp, 0);
  const coupon = couponCode ? coupons.find((c) => c.code === couponCode) : undefined;
  let discount = 0;
  let couponError: string | null = null;
  if (coupon) {
    if (subtotal < coupon.minOrder) couponError = `Add ₹${coupon.minOrder - subtotal} more to use ${coupon.code}`;
    else if (coupon.type === "percent") discount = Math.min(coupon.maxDiscount ?? Infinity, Math.round((subtotal * coupon.value) / 100));
    else if (coupon.type === "flat") discount = coupon.value;
  }
  const freeShip = subtotal - discount >= FREE_SHIPPING_AT || (coupon?.type === "shipping" && !couponError);
  const shipping = priced.length === 0 ? 0 : freeShip ? 0 : SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount + shipping);
  return {
    lines: priced, count: priced.reduce((a, b) => a + b.qty, 0), subtotal, mrpTotal, savings: mrpTotal - subtotal,
    discount: couponError ? 0 : discount, couponError, coupon: couponError ? undefined : coupon, shipping, total,
    toFreeShipping: Math.max(0, FREE_SHIPPING_AT - (subtotal - discount)),
  };
}

