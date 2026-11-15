import { notFound } from "next/navigation";
import { ListingView } from "@/components/store/listing-view";
import { getCategories, getCategory, getSubcategories } from "@/lib/data";
import { parseListingParams } from "@/lib/listing";

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">) {
  const c = await getCategory((await params).slug);
  return { title: c ? `${c.name} — ${c.tagline}` : "Category" };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await getCategory(slug);
  if (!cat) notFound();
  return (
    <ListingView title={cat.name} subtitle={cat.tagline} basePath={`/category/${slug}`}
      crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: cat.name }]}
      subs={await getSubcategories(slug)} query={{ ...parseListingParams(sp), category: slug }} searchParams={sp} />
  );
}
