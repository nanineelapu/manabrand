import { InventoryEditor } from "@/components/seller/inventory-editor";
import { PageHeader } from "@/components/shared/blocks";
import { LockedFeature } from "@/components/seller/locked-feature";
import { getCurrentSeller, getSellerProducts } from "@/lib/data";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const me = await getCurrentSeller();
  if (me && !me.permissions.manage_inventory) return <LockedFeature feature="Stock management" what="Your stock levels are managed by the ManaBrand team." />;
  return (
    <>
      <PageHeader title="Inventory" subtitle="Tap + / − to adjust stock per size. Out-of-stock sizes are hidden from shoppers." />
      <InventoryEditor products={await getSellerProducts()} />
    </>
  );
}
