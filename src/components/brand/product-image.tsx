import Image from "next/image";
import { photoUrl, type PhotoKind } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Photo for a product / category / banner. Fills its (relatively sized) parent.
 * `seed` (usually the product id) keeps each product's photo stable and distinct;
 * `color` selects a variant photo; `view` picks gallery angles.
 */
export function ProductImage({
  photo, seed, color, view = 0, className, title, priority, sizes = "(min-width: 1024px) 25vw, 50vw", rounded = true, w, h, src,
}: {
  photo: PhotoKind; seed?: string; color?: string; view?: number; className?: string; title?: string;
  priority?: boolean; sizes?: string; rounded?: boolean; w?: number; h?: number;
  /** An uploaded photo URL; when present it wins over the stock photo set. */
  src?: string;
}) {
  return (
    <span className={cn("relative block size-full overflow-hidden bg-bg-subtle", rounded && "rounded-[inherit]", className)}>
      <Image
        src={src || photoUrl(photo, { seed, variant: color, view, w, h })} alt={title ?? ""} fill sizes={sizes} unoptimized priority={priority}
        className="object-cover" aria-hidden={title ? undefined : true}
      />
    </span>
  );
}
