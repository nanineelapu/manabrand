import { DealBoxManager } from "@/components/admin/dealbox-manager";
import { PageHeader } from "@/components/shared/blocks";
import { getAllProducts, getDealBox } from "@/lib/data";
import { catTitle } from "@/lib/fashion";

export const metadata = { title: "Deal Box" };

export default async function DealBoxPage() {
  const [cfg, products] = await Promise.all([getDealBox(), getAllProducts()]);
  return (
    <>
      <PageHeader title="Mana Deal Box" subtitle="The members’ daily offer: set when it opens, the pass price and which products to feature." />
      <DealBoxManager initial={cfg} products={products.filter((p) => p.status === "active").map((p) => ({ id: p.id, name: p.name, category: catTitle(p.categorySlug) }))} />
    </>
  );
}
