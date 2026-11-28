import { ListingView } from "@/components/store/listing-view";
import { parseListingParams } from "@/lib/listing";

import { pageMeta, shopMeta } from "@/lib/seo";
export const metadata = pageMeta(shopMeta());

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  return (
    <ListingView title="All products" subtitle="Everything on ManaBrand — filter by category, price, rating and more."
      basePath="/shop" crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} query={parseListingParams(sp)} searchParams={sp} hideSubFilter />
  );
}
