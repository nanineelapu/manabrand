import Link from "next/link";
import { Hero } from "@/components/store/hero";
import { PopularCategories } from "@/components/store/popular-categories";
import { ManaDealBox } from "@/components/store/mana-deal-box";
import { WhySection } from "@/components/store/why-section";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { ProductImage } from "@/components/brand/product-image";
import { SectionHeader } from "@/components/ui/display";
import { ProductRail } from "@/components/store/product-card";
import { getHomeContent, getSiteContent } from "@/lib/cms";
import { getCategories, getNewArrivals, getTrending } from "@/lib/data";

/** Home tab title comes from the CMS (Site settings → Home page title). */
export async function generateMetadata() {
  return { title: { absolute: (await getSiteContent()).defaultTitle } };
}

const PROMOS = [
  { title: "Local Favourites", text: "Unique products from the shops around Ichapuram — tea, coffee, spices and more.", href: "/category/gourmet", photo: "coffee" },
  { title: "Home, Made Easy", text: "Furniture, decor and kitchen picks, delivered within 48 hours.", href: "/category/home", photo: "sofa" },
] as const;

export default async function HomePage() {
  const [cats, trending, fresh, c, site] = await Promise.all([
    getCategories(), getTrending(8), getNewArrivals(8), getHomeContent(), getSiteContent(),
  ]);

  return (
    <>
      <Hero c={c} slides={c.slides} site={site} />
      <PopularCategories title={c.categoriesCardTitle} eyebrow={c.categoriesTitle} cats={cats} />
      <section aria-labelledby="tr-h" data-round className="bg-white">
        <div className="container-page py-12 md:py-16">
          <Reveal><SectionHeader id="tr-h" eyebrow="Handpicked" title={c.trendingTitle} href="/shop" /></Reveal>
          <ProductRail products={trending} className="mt-7" />
        </div>
      </section>

      {/* two promo cards — edit the text, photo and link here */}
      <section aria-labelledby="col-h" data-round className="bg-neutral-50">
        <div className="container-page py-12 md:py-16">
          <Reveal><SectionHeader id="col-h" eyebrow="Shop local" title="Local favourites" href="/shop" /></Reveal>
          <Reveal className="mt-7 grid gap-4 md:grid-cols-2 md:gap-6">
            {PROMOS.map((promo) => (
              <Link key={promo.title} href={promo.href} className="group relative isolate aspect-[16/10] overflow-hidden rounded-[28px] md:aspect-[16/9] md:rounded-[36px]">
                <div className="size-full transition-transform duration-700 group-hover:scale-105"><ProductImage photo={promo.photo} seed={promo.title} w={900} h={560} sizes="50vw" rounded={false} /></div>
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white md:inset-x-7 md:bottom-7">
                  <div className="min-w-0">
                    <h3 className="text-xl font-black tracking-tight md:text-2xl">{promo.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[13px] text-white/85">{promo.text}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black transition-colors group-hover:bg-primary group-hover:text-white"><ArrowUpRight className="size-[18px]" /></span>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="new-h" data-round className="bg-white">
        <div className="container-page py-12 md:py-16">
          <Reveal><SectionHeader id="new-h" eyebrow="Just in" title={c.newArrivalsTitle} href="/new" /></Reveal>
          <ProductRail products={fresh} className="mt-7" />
        </div>
      </section>

      {/* Mana Deal Box: Exclusive VIP membership club */}
      <ManaDealBox />

      {/* sits right above the big "Find your next pick" card (rendered by the layout) */}
      <WhySection />
    </>
  );
}
