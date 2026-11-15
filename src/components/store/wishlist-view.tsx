"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, X } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { EmptyState, Price, Skeleton } from "@/components/ui/display";
import { Sheet } from "@/components/ui/sheet";
import { toast, useCart, useWishlist } from "@/lib/stores";
import { useMounted } from "@/lib/stores/hydrate";
import { cn } from "@/lib/utils";
import { useStoreData, type ProductLite } from "./store-data";

function MoveToBag({ p, onClose }: { p: ProductLite; onClose: () => void }) {
  const [size, setSize] = useState<string | null>(p.sizes.length === 1 ? p.sizes[0] : null);
  const [ci, setCi] = useState(0);
  const add = useCart((s) => s.add); const remove = useWishlist((s) => s.remove);
  return (
    <Sheet open onClose={onClose} side="dialog" title="Choose your options"
      footer={<Button full size="lg" className="rounded-full" onClick={() => {
        if (!size) { toast.error(`Please select a ${p.optionLabel.toLowerCase()}`); return; }
        add({ productId: p.id, color: p.colors[ci].name, size }); remove(p.id); toast.success("Moved to bag", { label: "View bag", href: "/cart" }); onClose();
      }}>Move to bag</Button>}>
      <div className="flex gap-4">
        <span className="aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl"><ProductImage photo={p.photo} seed={p.id} color={p.colors[ci].hex} src={p.image} /></span>
        <div><p className="text-sm font-medium">{p.name}</p><Price price={p.price} mrp={p.mrp} className="mt-1" /></div>
      </div>
      <p className="mb-2 mt-5 text-sm font-semibold">Colour: <span className="font-normal text-muted">{p.colors[ci].name}</span></p>
      <div className="flex gap-2.5">{p.colors.map((c, i) => <button key={c.name} aria-label={c.name} aria-pressed={i === ci} onClick={() => setCi(i)} className={cn("size-9 rounded-full border-2 p-0.5", i === ci ? "border-primary" : "border-transparent")}><span className="block size-full rounded-full border border-black/10" style={{ background: c.hex }} /></button>)}</div>
      <p className="mb-2 mt-5 text-sm font-semibold">{p.optionLabel}</p>
      <div className="grid grid-cols-4 gap-2">
        {p.sizes.map((s) => { const out = p.stock[s] === 0; return <button key={s} disabled={out} aria-pressed={size === s} onClick={() => setSize(s)} className={cn("h-11 rounded-ctl border text-sm font-medium", size === s ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card", out && "text-subtle line-through opacity-50")}>{s}</button>; })}
      </div>
    </Sheet>
  );
}

export function WishlistView() {
  const mounted = useMounted();
  const ids = useWishlist((s) => s.ids);
  const toggle = useWishlist((s) => s.toggle);
  const { byId } = useStoreData();
  const [moving, setMoving] = useState<ProductLite | null>(null);

  if (!mounted) return <div className="container-page grid grid-cols-2 gap-4 py-8 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}</div>;
  const items = ids.map((id) => byId.get(id)).filter(Boolean) as ProductLite[];

  return (
    <div className="container-page pb-6 pt-4 md:pt-8">
      <h1 className="font-display text-[30px] font-semibold tracking-tight md:text-4xl">Wishlist <span className="text-lg font-normal text-muted">({items.length})</span></h1>
      {items.length === 0 ? (
        <EmptyState icon={<Heart />} title="Nothing saved yet" body="Tap the heart on any product to save it here for later." action={<Button href="/shop" size="lg">Discover styles</Button>} />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
          {items.map((p) => (
            <article key={p.id} className="group relative">
              <Link href={`/product/${p.slug}`} className="block">
                <div className="aspect-[3/4] overflow-hidden rounded-card"><ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.image} rounded={false} title={p.name} /></div>
                <p className="mt-2.5 truncate text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">{p.sellerName}</p>
                <h2 className="line-clamp-1 text-[14px] font-medium">{p.name}</h2>
                <Price price={p.price} mrp={p.mrp} />
              </Link>
              <button aria-label={`Remove ${p.name} from wishlist`} onClick={() => { toggle(p.id); toast.info("Removed from wishlist"); }} className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white"><X className="size-4" /></button>
              <Button variant="outline" size="sm" full className="mt-2.5 rounded-full" onClick={() => setMoving(p)}>Move to bag</Button>
            </article>
          ))}
        </div>
      )}
      {moving && <MoveToBag p={moving} onClose={() => setMoving(null)} />}
    </div>
  );
}
