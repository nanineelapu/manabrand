import { ListingView } from "@/components/store/listing-view";
import { parseListingParams } from "@/lib/listing";

export const metadata = { title: "Sale" };

export default async function SalePage({ searchParams }: PageProps<"/sale">) {
  const sp = await searchParams;
  const q = parseListingParams(sp);
  return (
    <ListingView title="The Sale" subtitle="Up to 40% off men's and women's fashion." basePath="/sale"
      crumbs={[{ label: "Home", href: "/" }, { label: "Sale" }]}
      query={{ ...q, discount: q.discount ?? 25, sort: q.sort ?? "discount" }} searchParams={sp} hideSubFilter />
  );
}
