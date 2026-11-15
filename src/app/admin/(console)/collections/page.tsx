import { CollectionsManager } from "@/components/admin/collections-manager";
import { PageHeader } from "@/components/shared/blocks";
import { getCollections, queryProducts } from "@/lib/data";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const [collections, all] = await Promise.all([getCollections(), queryProducts({ pageSize: 500 })]);
  return (
    <>
      <PageHeader title="Collections" subtitle="Hand-pick products into themed groups shoppers can browse" />
      <CollectionsManager collections={collections} products={all.items.map((p) => ({ id: p.id, name: p.name, category: p.categorySlug }))} />
    </>
  );
}
