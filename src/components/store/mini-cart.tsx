"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { priceCart } from "@/lib/cart";
import { useCart, useUi } from "@/lib/stores";
import { formatINR } from "@/lib/utils";
import { useStoreData } from "./store-data";

export function CartLines({ compact }: { compact?: boolean }) {
  const { lines, setQty, remove } = useCart();
  const { byId, coupons } = useStoreData();
  const cart = priceCart(lines, byId, coupons, null);
  return (
    <ul className="divide-y divide-line">
      {cart.lines.map((l) => (
        <li key={l.key} className="flex gap-3.5 py-4">
          <Link href={`/product/${l.product.slug}`} className="size-24 shrink-0 overflow-hidden rounded-xl"><ProductImage photo={l.product.photo} seed={l.product.id} color={l.colorHex} src={l.product.image} /></Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-subtle">{l.product.sellerName}</p>
                <Link href={`/product/${l.product.slug}`} className="line-clamp-1 text-sm font-medium">{l.product.name}</Link>
                <p className="mt-0.5 text-xs text-muted">{l.color} · {l.size}</p>
              </div>
              <button aria-label={`Remove ${l.product.name}`} onClick={() => remove(l.key)} className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-subtle hover:bg-bg-subtle hover:text-danger"><Trash2 className="size-4" /></button>
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <QuantityStepper size="sm" value={l.qty} onChange={(n) => setQty(l.key, n)} />
              <span className="text-sm font-semibold tabular">{formatINR(l.lineTotal)}</span>
            </div>
          </div>
        </li>
      ))}
      {compact && null}
    </ul>
  );
}

export function MiniCart() {
  const open = useUi((s) => s.cartOpen);
  const setOpen = useUi((s) => s.setCart);
  const { lines } = useCart();
  const { byId, coupons } = useStoreData();
  const cart = priceCart(lines, byId, coupons, null);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onClose={close} side="auto" title={`Your bag${cart.count ? ` (${cart.count})` : ""}`}
      footer={cart.count > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between"><span className="text-sm text-muted">Subtotal</span><span className="text-lg font-semibold tabular">{formatINR(cart.subtotal)}</span></div>
          <div className="grid grid-cols-2 gap-2.5">
            <Button href="/cart" variant="outline" onClick={close}>View bag</Button>
            <Button href="/checkout" variant="primary" onClick={close}>Checkout</Button>
          </div>
        </div>
      )}>
      {cart.count === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <span className="mb-4 grid size-16 place-items-center rounded-full bg-bg-subtle"><ShoppingBag className="size-7 text-muted" /></span>
          <h3 className="font-display text-xl font-semibold">Your bag is empty</h3>
          <p className="mt-1 text-sm text-muted">Pieces you love will wait for you here.</p>
          <Button href="/shop" className="mt-6" onClick={close}>Start shopping</Button>
        </div>
      ) : (
        <>
          <CartLines compact />
        </>
      )}
    </Sheet>
  );
}
