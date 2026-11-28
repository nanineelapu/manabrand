import Link from "next/link";
import { catTitle, groupOf } from "@/lib/fashion";
import { notFound } from "next/navigation";
import { BadgeCheck, FileText, Scissors, Shirt, Truck } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Breadcrumb, Rating, SectionHeader } from "@/components/ui/display";
import { BuyBox, ProductGallery, ProductSelection } from "@/components/store/product-detail";
import { ProductRail } from "@/components/store/product-card";
import { ReviewsSection } from "@/components/store/reviews";
import { getCategory, getProduct, getProductReviews, getPublicSellerById, getRelated, queryProducts, ratingBreakdown } from "@/lib/data";

export async function generateStaticParams() {
  try { return (await queryProducts({ pageSize: 500 })).items.map((p) => ({ slug: p.slug })); } catch { return []; }   // pages are then built on first visit
}
export async function generateMetadata({ params }: PageProps<"/product/[slug]">) {
  const p = await getProduct((await params).slug);
  return p ? { title: p.seoTitle || p.name, description: p.seoDescription || p.description } : { title: "Product" };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const [cat, seller, reviews, related, grouped] = await Promise.all([
    getCategory(product.categorySlug), getPublicSellerById(product.sellerId), getProductReviews(product.id), getRelated(product, 8),
    groupOf(product.categorySlug) ? queryProducts({ group: groupOf(product.categorySlug)!, sort: "rating", pageSize: 40 }) : Promise.resolve(null),
  ]);
  // "Complete the look": one top-rated piece from each OTHER category in the same group (Men / Women)
  const look: NonNullable<typeof grouped>["items"] = [];
  const seen = new Set([product.categorySlug]);
  for (const p of grouped?.items ?? []) { if (seen.has(p.categorySlug)) continue; seen.add(p.categorySlug); look.push(p); if (look.length === 6) break; }

  return (
    <div className="container-page pb-20 pt-1.5 md:pb-6 md:pt-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: catTitle(product.categorySlug, cat?.name), href: `/category/${product.categorySlug}` }, { label: product.subcategory, href: `/category/${product.categorySlug}?sub=${encodeURIComponent(product.subcategory)}` }, { label: product.name }]} className="hidden md:block" />

      <ProductSelection product={product}>
        <div className="md:mt-6 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start"><ProductGallery product={product} /></div>
          <div className="mt-6 lg:mt-0">
            <BuyBox product={product} sellerName={seller?.name ?? "ManaBrand"} sellerSlug={seller?.slug ?? ""} />

            <Accordion className="mt-8">
              <AccordionItem title="Product details" icon={<FileText className="size-[18px]" />} defaultOpen name="pd">
                <p>{product.description}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5">{product.details.map((d) => <li key={d}>{d}</li>)}</ul>
              </AccordionItem>
              <AccordionItem title={"Fabric & care"} icon={<Shirt className="size-[18px]" />} name="pd">
                <p className="font-medium text-fg">{product.fabric}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">{product.care.map((d) => <li key={d}>{d}</li>)}</ul>
              </AccordionItem>
              <AccordionItem title="Shipping & delivery" icon={<Truck className="size-[18px]" />} name="pd">
                Delivered within 48 hours. Cash on delivery is available.{" "}
                <Link href="/shipping-returns" className="font-medium text-fg underline underline-offset-4">Read the full policy</Link>
              </AccordionItem>
              <AccordionItem title="About the seller" icon={<Scissors className="size-[18px]" />} name="pd">
                {seller && (
                  <Link href={`/sellers/${seller.slug}`} className="flex items-center gap-3 rounded-2xl bg-bg-subtle p-3.5 text-fg">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full font-display text-lg font-semibold text-white" style={{ background: seller.tone[1] }}>{seller.name[0]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-sm font-semibold">{seller.name} <BadgeCheck className="size-4 text-info" /></span>
                      <span className="block text-xs text-muted">{seller.city} · <Rating value={seller.rating} showValue size="sm" className="align-middle" /></span>
                    </span>
                    <span className="text-xs font-medium">Visit →</span>
                  </Link>
                )}
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </ProductSelection>

      <div className="mt-14 md:mt-20"><ReviewsSection product={product} reviews={reviews} breakdown={await ratingBreakdown(product.id)} /></div>

      {look.length > 0 && (
        <section className="mt-14 md:mt-20" aria-labelledby="look-h">
          <SectionHeader title="Complete the look" subtitle="Pieces that go with this one" />
          <h2 id="look-h" className="sr-only">Complete the look</h2>
          <ProductRail products={look} className="mt-6" />
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14 md:mt-20" aria-labelledby="rel-h">
          <SectionHeader title="You may also like"  href={`/category/${product.categorySlug}`} />
          <h2 id="rel-h" className="sr-only">Related products</h2>
          <ProductRail products={related} className="mt-6" />
        </section>
      )}
    </div>
  );
}
