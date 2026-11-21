"use client";

import { groupOf } from "@/lib/fashion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useRef, useState } from "react";
import { Check, Clock, MapPin, Ruler, ShieldCheck, Truck } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { Price, Rating } from "@/components/ui/display";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input } from "@/components/ui/form";
import { toast, useCart } from "@/lib/stores";
import { cn, discountPct, formatINR } from "@/lib/utils";
import type { Product } from "@/types";
import { SizeChart } from "./size-chart";
import { WishlistButton } from "./wishlist-button";

/* -------- shared selection state between gallery & buy box -------- */
interface Sel { color: number; setColor: (i: number) => void; size: string | null; setSize: (s: string | null) => void; sizeError: boolean; setSizeError: (b: boolean) => void }
const Ctx = createContext<Sel | null>(null);
const useSel = () => { const c = useContext(Ctx); if (!c) throw new Error("outside provider"); return c; };

export function ProductSelection({ product, children }: { product: Product; children: React.ReactNode }) {
  const [color, setColor] = useState(0);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [sizeError, setSizeError] = useState(false);
  return <Ctx.Provider value={{ color, setColor, size, setSize, sizeError, setSizeError }}>{children}</Ctx.Provider>;
}

/* ------------------------------ Gallery ------------------------------ */
export function ProductGallery({ product }: { product: Product }) {
  const { color } = useSel();
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const views = product.images.length ? product.images.map((_, i) => i) : [0, 1, 2, 3];
  const hex = product.colors[color].hex;

  const jump = (i: number) => { setActive(i); const el = scroller.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); };

  return (
    <div className="lg:grid lg:grid-cols-[84px_1fr] lg:gap-4">
      {/* desktop thumbs */}
      <div className="hidden flex-col gap-3 lg:flex" role="tablist" aria-label="Product images">
        {views.map((v) => (
          <button key={v} role="tab" aria-selected={active === v} aria-label={`View ${v + 1}`} onClick={() => setActive(v)}
            className={cn("aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all", active === v ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}>
            <ProductImage photo={product.photo} seed={product.id} color={hex} view={v} src={product.images[v]} />
          </button>
        ))}
      </div>

      {/* mobile: swipe · desktop: single large image */}
      <div className="relative -mx-4 md:mx-0">
        <div ref={scroller} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:hidden"
          onScroll={(e) => { const el = e.currentTarget; setActive(Math.round(el.scrollLeft / el.clientWidth)); }}>
          {views.map((v) => (
            <div key={v} className="aspect-[4/5] w-full shrink-0 snap-center md:aspect-[3/4] md:rounded-card md:overflow-hidden">
              <ProductImage photo={product.photo} seed={product.id} color={hex} view={v} src={product.images[v]} rounded={false} title={`${product.name} — view ${v + 1}`} />
            </div>
          ))}
        </div>
        <div className="hidden aspect-[3/4] overflow-hidden rounded-card lg:block">
          <ProductImage photo={product.photo} seed={product.id} color={hex} view={active} src={product.images[active]} title={product.name} />
        </div>
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden">
          {views.map((v) => <button key={v} aria-label={`Go to image ${v + 1}`} onClick={() => jump(v)} className={cn("h-1.5 rounded-full bg-fg transition-all", active === v ? "w-5" : "w-1.5 opacity-30")} />)}
        </div>
        <div className="absolute right-3 top-3 flex gap-2 lg:right-4 lg:top-4">
          <WishlistButton productId={product.id} className="size-11" />
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium tabular lg:hidden">{active + 1} / {views.length}</span>
      </div>
    </div>
  );
}

/* ------------------------------ Buy box ------------------------------ */
export function BuyBox({ product, sellerName, sellerSlug }: { product: Product; sellerName: string; sellerSlug: string }) {
  const { color, setColor, size, setSize, sizeError, setSizeError } = useSel();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [guide, setGuide] = useState(false);
  const [pin, setPin] = useState(""); const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const off = discountPct(product.price, product.mrp);
  const c = product.colors[color];

  const commit = (goCheckout: boolean) => {
    if (!size) {
      setSizeError(true);
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error(`Please select a ${product.optionLabel.toLowerCase()}`);
      return;
    }
    add({ productId: product.id, color: c.name, size });
    if (goCheckout) { router.push("/checkout"); return; }
    toast.success("Added to your bag", { label: "View bag", href: "/cart" });
  };

  const checkPin = () => {
    if (!/^[1-9]\d{5}$/.test(pin)) { setPinMsg({ ok: false, text: "Enter a valid 6-digit pincode" }); return; }
    setPinMsg({ ok: true, text: "Delivery within 48 hours · Free above ₹1,499 · COD available" });
  };

  const low = size ? product.stock[size] : undefined;
  const optLabel = product.optionLabel === "Standard" ? "option" : product.optionLabel.toLowerCase();
  const hasChoice = !(product.sizes.length === 1);
  const showGuide = groupOf(product.categorySlug) !== null && product.optionLabel === "Size" && product.sizes.length > 1 && product.photo !== "sneaker";

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/sellers/${sellerSlug}`} className="text-sm font-medium text-accent hover:underline">{sellerName}</Link>
        <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight md:text-3xl">{product.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          <a href="#reviews"><Rating value={product.rating} count={product.reviewCount} size="md" /></a>
          {product.badges.includes("bestseller") && <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-ink">Bestseller</span>}
        </div>
        <div className="mt-4"><Price price={product.price} mrp={product.mrp} size="xl" /></div>
        <p className="mt-1 text-xs text-muted">Inclusive of all taxes{off ? ` · You save ${formatINR(product.mrp - product.price)}` : ""}</p>
      </div>

      {/* colour — only when there is a real choice */}
      {product.colors.length > 1 && (
        <div>
          <p className="mb-2.5 text-sm"><span className="font-semibold">Colour:</span> <span className="text-muted">{c.name}</span></p>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Colour">
            {product.colors.map((col, i) => (
              <button key={col.name} role="radio" aria-checked={i === color} aria-label={col.name} title={col.name} onClick={() => setColor(i)}
                className={cn("grid size-11 place-items-center rounded-full border-2 transition-all", i === color ? "border-primary" : "border-transparent hover:border-line-strong")}>
                <span className="grid size-8 place-items-center rounded-full border border-black/10" style={{ background: col.hex }}>{i === color && <Check className="size-4 text-white mix-blend-difference" strokeWidth={3} />}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* option: size / storage / volume / pack … */}
      {hasChoice && (
        <div ref={sizeRef} className={cn("rounded-card transition-colors", sizeError && !size && "-m-3 bg-danger-bg p-3")}>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-sm font-semibold">Select {optLabel} {sizeError && !size && <span className="ml-1 font-normal text-danger">— required</span>}</p>
            {showGuide && <button onClick={() => setGuide(true)} className="inline-flex items-center gap-1.5 text-[13px] font-medium underline underline-offset-4"><Ruler className="size-4" /> Size guide</button>}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={product.optionLabel}>
            {product.sizes.map((s) => {
              const out = product.stock[s] === 0, on = size === s;
              return (
                <button key={s} role="radio" aria-checked={on} disabled={out} onClick={() => { setSize(s); setSizeError(false); }}
                  className={cn("relative h-12 min-w-14 rounded-ctl border px-4 text-sm font-medium transition-colors",
                    on ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card hover:border-primary",
                    out && "cursor-not-allowed border-line text-subtle line-through hover:border-line")}>
                  {s}
                  {out && <span className="sr-only"> (out of stock)</span>}
                </button>
              );
            })}
          </div>
          {low !== undefined && low > 0 && low <= 5 && <p className="mt-2 text-[13px] font-medium text-warning">Only {low} left — selling fast</p>}
        </div>
      )}

      {/* desktop actions (mobile uses the sticky bar) */}
      <div className="hidden gap-3 md:grid md:grid-cols-[1fr_auto]">
        <Button size="lg" onClick={() => commit(false)} className="rounded-full">Add to bag</Button>
        <WishlistButton productId={product.id} variant="outline" className="rounded-full" label="Wishlist" />
        <Button size="lg" variant="accent" onClick={() => commit(true)} className="col-span-2 rounded-full">Buy now</Button>
      </div>

      {/* delivery */}
      <div className="rounded-card border border-line bg-card p-4">
        <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-accent" /> Delivery options</p>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); checkPin(); }}>
          <Field htmlFor="pin" className="flex-1"><Input id="pin" inputMode="numeric" maxLength={6} placeholder="Enter pincode" value={pin} aria-label="Pincode" onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinMsg(null); }} invalid={pinMsg?.ok === false} /></Field>
          <Button type="submit" variant="outline">Check</Button>
        </form>
        {pinMsg && <p role="status" className={cn("mt-2 text-[13px] font-medium", pinMsg.ok ? "text-success" : "text-danger")}>{pinMsg.text}</p>}
        <ul className="mt-4 space-y-3 text-[13px] text-muted">
          <li className="flex items-center gap-3"><Truck className="size-[18px] shrink-0 text-fg" /> Free delivery on orders above ₹1,499</li>
          <li className="flex items-center gap-3"><Clock className="size-[18px] shrink-0 text-fg" /> Delivered within 48 hours</li>
          <li className="flex items-center gap-3"><ShieldCheck className="size-[18px] shrink-0 text-fg" /> Authentic · quality-checked by ManaBrand</li>
        </ul>
      </div>

      <Sheet open={guide} onClose={() => setGuide(false)} side="dialog" title="Size guide" description="Body measurements in inches. If you’re between sizes, size up.">
        <SizeChart highlight={size ?? undefined} />
        <p className="mt-4 text-xs text-muted">Tip: measure over light clothing and keep the tape snug but not tight.</p>
      </Sheet>

      {/* Mobile sticky CTA — tab bar is hidden on product pages so these never stack */}
      <StickyCta product={product} onAdd={() => commit(false)} onBuy={() => commit(true)} />
    </div>
  );
}

function StickyCta({ product, onAdd, onBuy }: { product: Product; onAdd: () => void; onBuy: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/97 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(26_22_19/0.06)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 shrink-0">
          <p className="text-lg font-semibold leading-none tabular">{formatINR(product.price)}</p>
          {product.mrp > product.price && <p className="mt-1 text-xs text-subtle line-through tabular">{formatINR(product.mrp)}</p>}
        </div>
        <Button onClick={onAdd} variant="outline" className="flex-1 rounded-full">Add to bag</Button>
        <Button onClick={onBuy} variant="accent" className="flex-1 rounded-full">Buy now</Button>
      </div>
    </div>
  );
}
