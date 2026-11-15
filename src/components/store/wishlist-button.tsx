"use client";

import { Heart } from "lucide-react";
import { toast, useWishlist } from "@/lib/stores";
import { useMounted } from "@/lib/stores/hydrate";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId, className, variant = "overlay", label,
}: { productId: string; className?: string; variant?: "overlay" | "outline"; label?: string }) {
  const mounted = useMounted();
  const ids = useWishlist((s) => s.ids);
  const toggle = useWishlist((s) => s.toggle);
  const on = mounted && ids.includes(productId);

  return (
    <button
      type="button" aria-pressed={on} aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        const added = toggle(productId);
        if (added) toast.success("Saved to wishlist", { label: "View", href: "/wishlist" }); else toast.info("Removed from wishlist");
      }}
      className={cn(
        "group/heart inline-flex items-center justify-center gap-2 transition-transform active:scale-90",
        variant === "overlay"
          ? "size-9 rounded-full bg-white/90 backdrop-blur hover:bg-white"
          : "h-[52px] rounded-ctl border border-line-strong bg-card px-4 text-[15px] font-medium hover:bg-bg-subtle",
        className,
      )}
    >
      <Heart key={String(on)} className={cn("size-[18px]", on ? "animate-heart fill-accent text-accent" : "text-fg")} />
      {label && <span>{on ? "Wishlisted" : label}</span>}
    </button>
  );
}
