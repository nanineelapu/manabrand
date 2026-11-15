import { PromotionsManager } from "@/components/seller/promotions-manager";
import { PageHeader } from "@/components/shared/blocks";
import { LockedFeature } from "@/components/seller/locked-feature";
import { getCurrentSeller, getSellerProducts, getSellerPromotions } from "@/lib/data";

export const metadata = { title: "Promotions" };

export default async function PromotionsPage() {
  const me = await getCurrentSeller();
  if (me && !me.permissions.run_promotions) return <LockedFeature feature="Promotions" />;
  const products = await getSellerProducts();
  return (
    <>
      <PageHeader title="Promotions" subtitle="Run discounts and join marketplace events to boost sales" />
      <PromotionsManager productNames={products.map((p) => p.name)} initial={await getSellerPromotions()} />
    </>
  );
}
