import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/display";
import { ProductImage } from "@/components/brand/product-image";
import type { PhotoKind } from "@/lib/images";

export interface CategoryTile { name: string; slug: string; photo: PhotoKind; count?: number; soon?: boolean }
export interface CategoryGroup { title: string; href?: string; tiles: CategoryTile[] }

/** Tile rail — swipeable on phones, a grid from tablet up. */
export function CategoryRail({ tiles }: { tiles: CategoryTile[] }) {
  return (
    <ul className="rise no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-6 xl:grid-cols-7">
      {tiles.map((k, i) => (
        <li key={k.slug} style={{ "--i": i } as React.CSSProperties} className="w-[38vw] shrink-0 snap-start sm:w-[26vw] md:w-auto">
            <Link href={`/category/${k.slug}`} className="zoomable group block">
              <span className="relative block aspect-[4/5] overflow-hidden rounded-[24px] bg-neutral-100">
                <span className="absolute inset-0" data-img>
                  <ProductImage photo={k.photo} seed={k.slug} sizes="(min-width: 1024px) 15vw, 38vw" rounded={false} />
                </span>
                <span className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white text-black transition-colors group-hover:bg-primary group-hover:text-white"><ArrowUpRight className="size-4" /></span>
              </span>
              <span className="mt-3 flex items-baseline justify-between gap-2 px-0.5">
                <span className="text-[15px] font-extrabold leading-tight tracking-tight text-black transition-colors group-hover:text-primary">{k.name}</span>
                {k.count != null && <span className="shrink-0 text-xs font-medium text-black/45 tabular">{k.count}</span>}
              </span>
            </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Shop by category" right under the hero: Men's and Women's categories as photo rails, then a Footwear banner
 * (launching soon). Titles come from the CMS (Home page).
 */
export function PopularCategories({ title, eyebrow, groups }: { title: string; eyebrow: string; groups: CategoryGroup[] }) {
  if (!groups.length) return null;
  return (
    <section id="categories" aria-labelledby="pop-h" data-round className="scroll-mt-4 bg-white text-black">
      <div className="container-page py-12 md:py-16">
        <SectionHeader id="pop-h" eyebrow={eyebrow} title={title} href="/shop" hrefLabel="Browse everything" />

        <div className="mt-8 space-y-10 md:mt-10 md:space-y-12">
          {groups.map((g) => {
            const soon = g.tiles.length === 1 && g.tiles[0].soon ? g.tiles[0] : null;
            return (
              <div key={g.title}>
                {soon ? (
                  
                    <Link href={`/category/${soon.slug}`} className="group relative isolate flex min-h-40 items-end overflow-hidden rounded-[28px] p-6 text-white md:min-h-48 md:p-8">
                      <span aria-hidden className="absolute inset-0 -z-10"><ProductImage photo={soon.photo} seed={soon.slug} sizes="100vw" rounded={false} /></span>
                      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
                      <span className="max-w-md">
                        <span className="inline-block rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black">Coming soon</span>
                        <span className="mt-3 block text-2xl font-black tracking-tight md:text-3xl">{g.title}</span>
                        <span className="mt-1 block text-sm text-white/80">Sneakers, casuals and sandals from local makers — arriving shortly.</span>
                      </span>
                    </Link>
                  
                ) : (
                  <>
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <h3 className="text-xl font-black tracking-tight md:text-2xl">{g.title}</h3>
                      {g.href && <Link href={g.href} className="text-sm font-semibold text-primary hover:underline">View all</Link>}
                    </div>
                    <CategoryRail tiles={g.tiles} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
