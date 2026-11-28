import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingView } from "@/components/store/listing-view";
import { Breadcrumb } from "@/components/ui/display";
import { getCategories, getCategory, getSubcategories } from "@/lib/data";
import { GROUPS, catTitle, groupOf } from "@/lib/fashion";
import { parseListingParams } from "@/lib/listing";
import { JsonLd, breadcrumbJsonLd, categoryMeta, pageMeta } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const c = await getCategory(slug);
  if (!c) return pageMeta({ title: "Category not found", description: "This category does not exist on ManaBrand.", path: `/category/${slug}`, noindex: true });
  const sub = typeof sp.sub === "string" ? sp.sub : Array.isArray(sp.sub) ? sp.sub[0] : undefined;
  return pageMeta(categoryMeta({ name: catTitle(c.slug, c.name), slug: c.slug, sub, productCount: c.productCount }));
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const group = GROUPS.find((g) => g.id === groupOf(slug));
  const title = catTitle(cat.slug, cat.name);
  const crumbs = [{ label: "Home", href: "/" }, ...(group ? [{ label: group.name, href: `/${group.id}` }] : [{ label: "Shop", href: "/shop" }]), { label: cat.name }];

  // a category with no products that isn't part of Men / Women (Footwear) is "launching soon"
  if (!group && cat.productCount === 0) {
    return (
      <div className="container-page pb-16 pt-4 md:pt-6">
        <Breadcrumb items={crumbs} />
        <div className="mx-auto mt-10 max-w-xl text-center md:mt-16">
          <span className="inline-block rounded-full bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Coming soon</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 text-muted">We are lining up local footwear makers. Sneakers, casual shoes and sandals will land here shortly.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {GROUPS.map((g) => <Link key={g.id} href={`/${g.id}`} className="inline-flex h-12 items-center rounded-2xl bg-primary px-6 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover">Shop {g.name}</Link>)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      {/* Google reads these blocks to show the crumb trail directly under the search result. */}
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        ...(group ? [{ name: group.name, path: `/${group.id}` }] : [{ name: "Shop", path: "/shop" }]),
        { name: cat.name },
      ])} />
      <ListingView title={title} subtitle={cat.tagline} basePath={`/category/${slug}`} crumbs={crumbs}
        subs={await getSubcategories(slug)} query={{ ...parseListingParams(sp), category: slug }} searchParams={sp} />
    </>
  );
}
