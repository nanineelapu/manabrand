import { InventoryEditor } from "@/components/seller/inventory-editor";
import { PageHeader } from "@/components/shared/blocks";
import { getAllProducts } from "@/lib/data";

export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage() {
  return (
    <>
      <PageHeader title="Inventory" subtitle="Every product, every size. Tap + / − to change stock, then save. Out-of-stock sizes are hidden from shoppers." />
      <InventoryEditor products={await getAllProducts()} />
    </>
  );
}
