import Link from "next/link";
import { Hero } from "@/components/store/hero";
import { PopularCategories } from "@/components/store/popular-categories";
import { WhySection } from "@/components/store/why-section";
import { ArrowUpRight, BadgeCheck, MapPin, Star } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { ProductImage } from "@/components/brand/product-image";
import { SectionHeader } from "@/components/ui/display";
import { ProductRail } from "@/components/store/product-card";
import { getHomeContent, getSiteContent } from "@/lib/cms";
import { getActiveSellers, getCategories, getNewArrivals, getTrending } from "@/lib/data";

/** Home tab title comes from the CMS (Site settings → Home page title). */
export async function generateMetadata() {
  return { title: { absolute: (await getSiteContent()).defaultTitle } };
}

const PROMOS = [
  { title: "Local Favourites", text: "Unique products from the shops around Ichapuram — tea, coffee, spices and more.", href: "/category/gourmet", photo: "coffee" },
  { title: "Home, Made Easy", text: "Furniture, decor and kitchen picks, delivered within 48 hours.", href: "/category/home", photo: "sofa" },
] as const;

export default async function HomePage() {
  const [cats, trending, fresh, sellers, c, site] = await Promise.all([
    getCategories(), getTrending(8), getNewArrivals(8), getActiveSellers(), getHomeContent(), getSiteContent(),
  ]);

  // the one featured local seller: Shekar Studio & Gift Shop (falls back to the best-rated active shop if it isn't in the data)
  const FEATURED_SELLER = "shekar-studio-gift-shop";
  const active = sellers.filter((x) => x.status === "active");
  const featured = active.find((x) => x.slug === FEATURED_SELLER) ?? [...active].sort((x, y) => y.rating - x.rating)[0];
  const localSellers = featured ? [featured] : [];

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

      {/* sellers — all local to Ichapuram */}
      <section aria-labelledby="sl-h" data-round className="bg-neutral-50">
        <div className="container-page py-12 md:py-16">
          <Reveal><SectionHeader id="sl-h" eyebrow="Ichapuram" title={c.sellersTitle} subtitle={c.sellersSubtitle} /></Reveal>
          <ul className="mt-7">
            {localSellers.map((x) => (
              <li key={x.id} className="max-w-xl">
                <Link href={`/sellers/${x.slug}`} className="group flex h-full flex-col rounded-[26px] border border-black/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-black text-white" style={{ background: x.tone[1] }}>{x.name[0]}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-bold"><BadgeCheck className="size-3.5 text-primary" />Local seller</span>
                  </div>
                  <h3 className="mt-5 text-[17px] font-extrabold tracking-tight">{x.name}</h3>
                  <p className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-fg"><MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />{x.pickupAddress?.replace(/, Andhra Pradesh$/, "") ?? x.city}</p>
                  <p className="mb-5 mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">{x.blurb}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/10 pt-4 text-xs font-medium text-muted">
                    <span className="inline-flex items-center gap-1"><Star className="size-3.5 fill-primary text-primary" />{x.rating.toFixed(1)} · Owner: {x.owner}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-fg group-hover:text-primary">Visit shop <ArrowUpRight className="size-3.5" /></span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* sits right above the big "Find your next pick" card (rendered by the layout) */}
      <WhySection />
    </>
  );
}
