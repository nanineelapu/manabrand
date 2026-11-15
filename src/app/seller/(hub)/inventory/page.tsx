import { InventoryEditor } from "@/components/seller/inventory-editor";
import { PageHeader } from "@/components/shared/blocks";
import { getSellerProducts } from "@/lib/data";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  return (
    <>
      <PageHeader title="Inventory" subtitle="Tap + / − to adjust stock per size. Out-of-stock sizes are hidden from shoppers." />
      <InventoryEditor products={await getSellerProducts()} />
    </>
  );
}
