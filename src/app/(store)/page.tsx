import Link from "next/link";
import { Hero } from "@/components/store/hero";
import { PopularCategories } from "@/components/store/popular-categories";
import { WhySection } from "@/components/store/why-section";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { ProductImage } from "@/components/brand/product-image";
import { SectionHeader } from "@/components/ui/display";
import { ProductRail } from "@/components/store/product-card";
import { getHomeContent, getSiteContent } from "@/lib/cms";
import { getActiveSellers, getCategories, getCollections, getNewArrivals, getTrending } from "@/lib/data";

/** Home tab title comes from the CMS (Site settings → Home page title). */
export async function generateMetadata() {
  return { title: { absolute: (await getSiteContent()).defaultTitle } };
}

export default async function HomePage() {
  const [cats, trending, fresh, collections, sellers, c, site] = await Promise.all([
    getCategories(), getTrending(8), getNewArrivals(8), getCollections(), getActiveSellers(), getHomeContent(), getSiteContent(),
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

      {/* collections */}
      <section aria-labelledby="col-h" data-round className="bg-neutral-50">
        <div className="container-page py-12 md:py-16">
          <Reveal><SectionHeader id="col-h" eyebrow="Curated" title="Featured collections" href="/collections" /></Reveal>
          <Reveal className="mt-7 grid gap-4 md:grid-cols-2 md:gap-6">
            {collections.slice(1, 3).map((col) => (
              <Link key={col.id} href={`/collections/${col.slug}`} className="group relative isolate aspect-[16/10] overflow-hidden rounded-[28px] md:aspect-[16/9] md:rounded-[36px]">
                <div className="size-full transition-transform duration-700 group-hover:scale-105"><ProductImage photo={col.photo} seed={col.slug} w={900} h={560} sizes="50vw" rounded={false} /></div>
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white md:inset-x-7 md:bottom-7">
                  <div className="min-w-0">
                    <h3 className="text-xl font-black tracking-tight md:text-2xl">{col.name}</h3>
                    <p className="mt-1 line-clamp-1 text-[13px] text-white/80">{col.story}</p>
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

      {/* sellers */}
      <section aria-labelledby="sl-h" data-round className="bg-neutral-50">
        <div className="container-page py-12 md:py-16">
          <Reveal><SectionHeader id="sl-h" eyebrow="Trusted" title={c.sellersTitle} subtitle={c.sellersSubtitle} /></Reveal>
          <div className="no-scrollbar snap-row -mx-4 mt-7 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
            {sellers.filter((x) => x.rating >= 4.5).slice(0, 4).map((x) => (
              <Link key={x.id} href={`/sellers/${x.slug}`} className="group flex w-[72vw] max-w-[300px] shrink-0 items-center gap-3.5 rounded-3xl border border-black/10 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary md:w-auto md:max-w-none">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white" style={{ background: x.tone[1] }}>{x.name[0]}</span>
                <span className="min-w-0"><span className="block truncate text-sm font-bold">{x.name}</span><span className="block truncate text-xs text-muted">{x.city} · ★ {x.rating.toFixed(1)}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* sits right above the big "Find your next pick" card (rendered by the layout) */}
      <WhySection />
    </>
  );
}
