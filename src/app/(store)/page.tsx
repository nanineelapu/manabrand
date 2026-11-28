import Link from "next/link";
import { Hero } from "@/components/store/hero";
import { PopularCategories } from "@/components/store/popular-categories";
import { ManaDealBox } from "@/components/store/mana-deal-box";
import { WhySection } from "@/components/store/why-section";
import { SellOnMana } from "@/components/store/sell-on-mana";
import { homeMeta, pageMeta } from "@/lib/seo";
import { ArrowUpRight } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { SectionHeader } from "@/components/ui/display";
import { ProductRail } from "@/components/store/product-card";
import { getHomeContent, getSiteContent } from "@/lib/cms";
import { getCategories, getDealBox, getNewArrivals, getTrending, queryProducts } from "@/lib/data";
import { GROUPS, groupOf } from "@/lib/fashion";

/** Home page metadata. Title and description come from the CMS when set; otherwise the honest defaults from pageMeta. */
export async function generateMetadata() {
  const site = await getSiteContent();
  const base = homeMeta();
  return pageMeta({ ...base, title: site.defaultTitle, description: site.description || base.description, rawTitle: true });
}

const PROMOS = [
  { title: "The Wedding Edit", text: "Silk sarees, statement jewellery and festive wear for the season of shaadis.", href: "/collections/wedding-edit", photo: "saree" },
  { title: "Street Style", text: "Shirts, denim and layers for everyday menswear — from local studios.", href: "/collections/street-style", photo: "jacket" },
] as const;

export default async function HomePage() {
  const [cats, trending, fresh, c, site, deal] = await Promise.all([
    getCategories(), getTrending(8), getNewArrivals(8), getHomeContent(), getSiteContent(), getDealBox(),
  ]);
  const picks = deal.productIds.length ? (await queryProducts({ ids: deal.productIds, pageSize: 12 })).items : [];
  const tile = (k: (typeof cats)[number]) => ({ name: k.name, slug: k.slug, photo: k.photo, count: k.productCount, soon: !groupOf(k.slug) && k.productCount === 0 });
  const groups = [
    ...GROUPS.map((g) => ({ title: g.title, href: `/${g.id}`, tiles: cats.filter((k) => groupOf(k.slug) === g.id).map(tile) })),
    ...cats.filter((k) => !groupOf(k.slug)).map((k) => ({ title: k.name, tiles: [tile(k)] })),
  ].filter((g) => g.tiles.length);

  return (
    <>
      <Hero c={c} slides={c.slides} site={site} />
      <PopularCategories title={c.categoriesCardTitle} eyebrow={c.categoriesTitle} groups={groups} />
      <section aria-labelledby="tr-h" data-round className="bg-white">
        <div className="container-page py-12 md:py-16">
          <SectionHeader id="tr-h" eyebrow="Handpicked" title={c.trendingTitle} href="/shop" />
          <ProductRail products={trending} className="mt-7" />
        </div>
      </section>

      {/* two collection cards — edit the text, photo and link here */}
      <section aria-labelledby="col-h" data-round className="bg-neutral-50">
        <div className="container-page py-12 md:py-16">
          <SectionHeader id="col-h" eyebrow="Curated" title="Fashion edits" href="/collections" hrefLabel="All collections" />
          <div className="rise mt-7 grid gap-4 md:grid-cols-2 md:gap-6">
            {PROMOS.map((promo, i) => (
              <Link key={promo.title} href={promo.href} style={{ "--i": i } as React.CSSProperties} className="zoomable group relative isolate aspect-[16/10] overflow-hidden rounded-[28px] md:aspect-[16/9] md:rounded-[36px]">
                <div className="size-full" data-img><ProductImage photo={promo.photo} seed={promo.title} w={900} h={560} sizes="50vw" rounded={false} /></div>
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white md:inset-x-7 md:bottom-7">
                  <div className="min-w-0">
                    <h3 className="text-xl font-black tracking-tight md:text-2xl">{promo.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[13px] text-white/85">{promo.text}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black group-hover:bg-primary group-hover:text-white"><ArrowUpRight className="size-[18px]" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="new-h" data-round className="bg-white">
        <div className="container-page py-12 md:py-16">
          <SectionHeader id="new-h" eyebrow="Just in" title={c.newArrivalsTitle} href="/new" />
          <ProductRail products={fresh} className="mt-7" />
        </div>
      </section>

      {/* Mana Deal Box: Exclusive VIP membership club */}
      <ManaDealBox config={deal} picks={picks} />

      {/* sits right above the big "Find your next look" card (rendered by the layout) */}
      <WhySection />

      {/* Sell on ManaBrand — tells makers and shops they can list products, sits above the footer */}
      <SellOnMana />
    </>
  );
}
