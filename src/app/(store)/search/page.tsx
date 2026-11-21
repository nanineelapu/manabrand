import { ListingView } from "@/components/store/listing-view";
import { parseListingParams } from "@/lib/listing";

export async function generateMetadata({ searchParams }: PageProps<"/search">) {
  const q = (await searchParams).q;
  return { title: q ? `Results for “${Array.isArray(q) ? q[0] : q}”` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = parseListingParams(sp);
  return (
    <ListingView title={q.q ? `Results for “${q.q}”` : "Search"} subtitle={q.q ? undefined : "Type in the search bar to find sarees, kurtas, sneakers, jewellery and more."}
      basePath="/search" crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]} query={q} searchParams={sp} hideSubFilter />
  );
}
