"use client";

import Link from "next/link";
import { Gift, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { Breadcrumb, EmptyState } from "@/components/ui/display";
import { QuantityStepper } from "@/components/ui/form";
import { toast, useCart, useWishlist } from "@/lib/stores";
import { useMounted } from "@/lib/stores/hydrate";
import { discountPct, formatINR } from "@/lib/utils";
import { stockIssue } from "@/lib/cart";
import { walletToUse } from "@/lib/wallet";
import { CouponBox, PriceBreakdown, useCartPricing } from "./price-breakdown";
import { WalletCard } from "./wallet-card";
import { Skeleton } from "@/components/ui/display";

export function CartView({ isGuest = false, walletBalance = 0 }: { isGuest?: boolean; walletBalance?: number }) {
  const mounted = useMounted();
  const cart = useCartPricing();
  // a line that cannot be fulfilled (sold out, or more than what is left) blocks checkout until fixed
  const blocked = cart.lines.some((l) => stockIssue(l)?.blocking);
  const itemsValue = Math.max(0, cart.subtotal - cart.discount);   // the wallet tier follows what you buy, not delivery fees
  const { setQty, remove } = useCart();
  const wish = useWishlist();

  if (!mounted) return <div className="container-page space-y-4 py-8"><Skeleton className="h-8 w-40" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  if (cart.count === 0) {
    return (
      <div className="container-page py-10 md:py-20">
        <EmptyState
          icon={<ShoppingBag />}
          title="Your bag is empty"
          body={isGuest ? "Add items you love — they’ll wait for you here. Create an account to claim ₹500 in your wallet!" : "Add items you love — they’ll wait for you here."}
          action={
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button href="/shop" size="lg" className="rounded-full">Start shopping</Button>
              {isGuest ? (
                <Button href="/register?next=/cart" size="lg" variant="outline" className="rounded-full">Sign up & get ₹500</Button>
              ) : (
                <Button href="/wishlist" size="lg" variant="outline" className="rounded-full">View wishlist</Button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page pb-32 pt-4 md:pb-10 md:pt-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Bag" }]} className="hidden md:block" />
      <h1 className="font-display text-[30px] font-semibold tracking-tight md:mt-4 md:text-4xl">Your bag <span className="text-lg font-normal text-muted">({cart.count})</span></h1>

      {isGuest && (
        <div className="mt-4 flex flex-col items-start justify-between gap-3.5 rounded-2xl border border-accent/25 bg-accent-soft p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-fg">
              <Gift className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-accent-soft-fg">Get ₹500 off with your wallet</p>
              <p className="text-xs text-muted">Sign up and get an instant ₹500 welcome gift in your wallet — use ₹200 to ₹350 on every order of ₹999 or more.</p>
            </div>
          </div>
          <Button href="/register?next=/checkout" size="sm" variant="outline" className="shrink-0 rounded-full bg-card hover:bg-bg-subtle">
            Claim ₹500
          </Button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
        <div className="min-w-0">
          <ul className="mt-2 divide-y divide-line">
            {cart.lines.map((l) => {
              const off = discountPct(l.product.price, l.product.mrp);
              return (
                <li key={l.key} className="flex gap-3 py-5 sm:gap-4">
                  <Link href={`/product/${l.product.slug}`} className="aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-2xl min-[400px]:w-24 md:w-28"><ProductImage photo={l.product.photo} seed={l.product.id} color={l.colorHex} src={l.product.image} /></Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">{l.product.sellerName}</p>
                    <Link href={`/product/${l.product.slug}`} className="line-clamp-2 text-[15px] font-medium leading-snug">{l.product.name}</Link>
                    <p className="mt-1 text-[13px] text-muted">{l.color} · Size {l.size}</p>
                    {(() => { const issue = stockIssue(l); return issue ? <p role={issue.blocking ? "alert" : undefined} className={issue.blocking ? "mt-1 text-[13px] font-semibold text-danger" : "mt-1 text-[13px] font-medium text-warning"}>{issue.text}</p> : null; })()}
                    <p className="mt-2 flex items-baseline gap-2 tabular">
                      <span className="font-semibold">{formatINR(l.product.price)}</span>
                      {off > 0 && <><span className="text-xs text-subtle line-through">{formatINR(l.product.mrp)}</span><span className="text-xs font-semibold text-success">{off}% off</span></>}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                      <QuantityStepper size="sm" value={l.qty} onChange={(n) => setQty(l.key, n)} />
                      <div className="flex items-center gap-1">
                        <button onClick={() => { if (!wish.has(l.product.id)) wish.toggle(l.product.id); remove(l.key); toast.success("Moved to wishlist"); }} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted hover:bg-bg-subtle hover:text-fg"><Heart className="size-4" /> <span className="hidden xs:inline">Move to wishlist</span><span className="xs:hidden">Save</span></button>
                        <button aria-label={`Remove ${l.product.name}`} onClick={() => { remove(l.key); toast.info("Removed from bag"); }} className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger-bg hover:text-danger"><Trash2 className="size-4" /></button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-3xl border border-line bg-card p-5 shadow-card">
            <h2 className="mb-3 text-[15px] font-semibold">Apply coupon</h2>
            <CouponBox />
            {cart.couponError && <p className="mt-2 text-xs text-danger">{cart.couponError}</p>}
          </section>
          <section className="rounded-3xl border border-line bg-card p-5 shadow-card">
            <h2 className="mb-4 text-[15px] font-semibold">Price details</h2>
            <PriceBreakdown />
            {walletBalance > 0 && <div className="mt-4"><WalletCard balance={walletBalance} itemsValue={itemsValue} canUse={walletToUse(walletBalance, itemsValue, cart.total)} /></div>}
            {blocked ? <Button size="lg" full disabled className="mt-5 hidden rounded-full lg:inline-flex">Fix your bag to continue</Button> : <Button href="/checkout" size="lg" full className="mt-5 hidden rounded-full lg:inline-flex">Proceed to checkout</Button>}
          </section>
        </aside>
      </div>

      {/* mobile sticky checkout */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/97 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="min-w-0"><p className="text-xs text-muted">Total</p><p className="text-xl font-semibold leading-tight tabular">{formatINR(cart.total)}</p></div>
          {blocked ? <Button size="lg" disabled className="flex-1 rounded-full">Fix your bag</Button> : <Button href="/checkout" size="lg" className="flex-1 rounded-full">Checkout</Button>}
        </div>
      </div>
    </div>
  );
}
