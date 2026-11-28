import { notFound } from "next/navigation";
import { ListingView } from "@/components/store/listing-view";
import { getCollection, getCollections } from "@/lib/data";
import { parseListingParams } from "@/lib/listing";
import { JsonLd, breadcrumbJsonLd, collectionMeta, pageMeta } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getCollections()).map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({ params }: PageProps<"/collections/[slug]">) {
  const c = await getCollection((await params).slug);
  if (!c) return pageMeta({ title: "Collection not found", description: "This collection does not exist on ManaBrand.", path: `/collections/${(await params).slug}`, noindex: true });
  return pageMeta(collectionMeta({ name: c.name, slug: c.slug, story: c.story }));
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const c = await getCollection(slug);
  if (!c) notFound();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }, { name: c.name }])} />
      <ListingView title={c.name} subtitle={c.story} basePath={`/collections/${slug}`} hideSubFilter
        crumbs={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: c.name }]}
        query={{ ...parseListingParams(sp), collection: slug }} searchParams={sp} />
    </>
  );
}
