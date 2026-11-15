import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/display";
import { ProductImage } from "@/components/brand/product-image";
import { Reveal } from "@/components/ui/motion";
import type { Category } from "@/types";

/**
 * Dedicated "Popular categories" section right under the hero — minimal: a clean heading, then one photo tile
 * per category with its name and item count underneath. Titles come from the CMS (Home page).
 */
export function PopularCategories({ title, eyebrow, cats }: { title: string; eyebrow: string; cats: Category[] }) {
  if (!cats.length) return null;
  return (
    <section id="categories" aria-labelledby="pop-h" data-round className="scroll-mt-4 bg-white text-black">
      <div className="container-page py-12 md:py-16">
        <Reveal><SectionHeader id="pop-h" eyebrow={eyebrow} title={title} href="/shop" hrefLabel="Browse everything" /></Reveal>

        <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:mt-9 md:gap-x-6 lg:grid-cols-6">
          {cats.map((k, i) => (
            <li key={k.slug}>
              <Reveal delay={i * 60}>
                <Link href={`/category/${k.slug}`} className="group block">
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-[28px] bg-neutral-100">
                    <span className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.06]">
                      <ProductImage photo={k.photo} seed={k.slug} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 46vw" rounded={false} />
                    </span>
                    <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white text-black transition-all duration-300 group-hover:bg-primary group-hover:text-white"><ArrowUpRight className="size-4" /></span>
                  </span>
                  <span className="mt-4 flex items-baseline justify-between gap-2 px-1">
                    <span className="text-[17px] font-extrabold tracking-tight text-black transition-colors group-hover:text-primary">{k.name}</span>
                    <span className="text-xs font-medium text-black/45 tabular">{k.productCount} items</span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
