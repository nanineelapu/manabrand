"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useCart, toast } from "@/lib/stores";
import { cn, discountPct, formatINR } from "@/lib/utils";
import type { Product } from "@/types";

/** "Quick view" on a product card: look at a product, pick a size and add it to the bag without leaving the page. */
export function QuickView({ product: p }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState(p.colors[0]?.name ?? "");
  const add = useCart((s) => s.add);
  const off = discountPct(p.price, p.mrp);
  const left = size ? p.stock[size] : undefined;

  const addToBag = () => {
    if (!size) { toast.error(`Choose a ${p.optionLabel.toLowerCase()} first`); return; }
    add({ productId: p.id, color, size });
    toast.success("Added to your bag", { label: "View bag", href: "/cart" });
    setOpen(false);
  };

  return (
    <>
      <button type="button" aria-label={`Quick view ${p.name}`} onClick={() => setOpen(true)}
        className="absolute inset-x-3 bottom-[4.4rem] z-10 hidden h-10 items-center justify-center gap-2 rounded-full bg-white/95 text-[13px] font-bold text-black opacity-0 shadow-md backdrop-blur transition-all duration-200 hover:bg-white group-hover:opacity-100 md:inline-flex">
        <Eye className="size-4" /> Quick view
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} side="dialog" title={p.name}
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" href={`/product/${p.slug}`} onClick={() => setOpen(false)}>Full details</Button><Button onClick={addToBag}>Add to bag</Button></div>}>
        <div className="grid gap-5 sm:grid-cols-[170px_1fr]">
          <div className="aspect-[3/4] overflow-hidden rounded-xl"><ProductImage photo={p.photo} seed={p.id} color={p.colors.find((c) => c.name === color)?.hex} src={p.images?.[0]} /></div>
          <div className="min-w-0">
            <p className="flex items-baseline gap-2 tabular"><span className="text-xl font-semibold">{formatINR(p.price)}</span>{off > 0 && <><span className="text-sm text-subtle line-through">{formatINR(p.mrp)}</span><span className="text-sm font-semibold text-success">{off}% off</span></>}</p>
            <p className="mt-3 text-[13px] font-medium">Colour: <span className="text-muted">{color}</span></p>
            <div className="mt-1.5 flex flex-wrap gap-2">{p.colors.map((c) => (
              <button key={c.name} type="button" aria-label={c.name} aria-pressed={color === c.name} onClick={() => setColor(c.name)}
                className={cn("size-8 rounded-full border-2", color === c.name ? "border-primary" : "border-line-strong")} style={{ background: c.hex }} />
            ))}</div>
            <p className="mt-4 text-[13px] font-medium">{p.optionLabel}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">{p.sizes.map((s) => {
              const out = p.stock[s] === 0;
              return <button key={s} type="button" disabled={out} aria-pressed={size === s} onClick={() => setSize(s)}
                className={cn("h-10 min-w-11 rounded-lg border px-3 text-sm font-medium", out ? "cursor-not-allowed border-line text-subtle line-through" : size === s ? "border-primary bg-primary text-primary-fg" : "border-line-strong hover:border-fg")}>{s}</button>;
            })}</div>
            {left !== undefined && left > 0 && left <= 5 && <p className="mt-2 text-[13px] font-medium text-warning">Only {left} left</p>}
            <Link href={`/product/${p.slug}`} onClick={() => setOpen(false)} className="mt-4 inline-block text-sm font-medium underline underline-offset-4">View full details</Link>
          </div>
        </div>
      </Sheet>
    </>
  );
}
