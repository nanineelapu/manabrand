import Link from "next/link";
import { Star } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { WishlistButton } from "./wishlist-button";
import { cn, discountPct, formatINR } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCard({ product: p, className, priority, style }: { product: Product; className?: string; priority?: boolean; style?: React.CSSProperties }) {
  const off = discountPct(p.price, p.mrp);
  const tag = p.badges.includes("new") ? "New" : off >= 20 ? `${off}% off` : null;
  return (
    <article style={style} data-round className={cn("group relative", className)}>
      <Link href={`/product/${p.slug}`} className="block" aria-label={`${p.name}, ${p.price} rupees`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-neutral-100 md:rounded-[26px]">
          <div className="size-full transition-transform duration-500 ease-out group-hover:scale-[1.05]">
            <ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.images?.[0]} rounded={false} title={p.name} priority={priority} />
          </div>
          {tag && <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">{tag}</span>}
        </div>
        <div className="px-1 pt-3">
          <h3 className="line-clamp-1 text-[14px] font-semibold leading-snug">{p.name}</h3>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="flex items-baseline gap-1.5 tabular">
              <span className="text-[15px] font-semibold">{formatINR(p.price)}</span>
              {off > 0 && <span className="text-xs text-subtle line-through">{formatINR(p.mrp)}</span>}
            </p>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted tabular"><Star className="size-3 fill-gold-500 text-gold-500" />{p.rating.toFixed(1)}</span>
          </div>
        </div>
      </Link>
      <WishlistButton productId={p.id} className="absolute right-2 top-2" />
    </article>
  );
}

/** Horizontally scrolling rail on mobile (peek of next card), grid on lg. */
export function ProductRail({ products, className, cols = 4 }: { products: Product[]; className?: string; cols?: 3 | 4 | 5 }) {
  const lg = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }[cols];
  return (
    <div className={cn("stagger no-scrollbar snap-row -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 lg:grid lg:gap-5 lg:overflow-visible", lg, className)}>
      {products.map((p, i) => <ProductCard key={p.id} product={p} style={{ "--i": i } as React.CSSProperties} className="w-[46vw] max-w-[230px] shrink-0 md:w-[30vw] lg:w-auto lg:max-w-none" />)}
    </div>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn("stagger grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-5 md:gap-y-8 xl:grid-cols-4", className)}>
      {products.map((p, i) => <div key={p.id} style={{ "--i": i } as React.CSSProperties}><ProductCard product={p} priority={i < 4} /></div>)}
    </div>
  );
}
