import { ListingView } from "@/components/store/listing-view";
import { parseListingParams } from "@/lib/listing";

import { newMeta, pageMeta } from "@/lib/seo";
export const metadata = pageMeta(newMeta());

export default async function NewPage({ searchParams }: PageProps<"/new">) {
  const sp = await searchParams;
  return (
    <ListingView title="New arrivals" subtitle="The latest arrivals from our sellers this week." basePath="/new"
      crumbs={[{ label: "Home", href: "/" }, { label: "New arrivals" }]}
      query={{ ...parseListingParams(sp), badge: "new", sort: parseListingParams(sp).sort ?? "new" }} searchParams={sp} hideSubFilter />
  );
}
