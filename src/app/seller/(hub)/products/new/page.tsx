import { PageHeader } from "@/components/shared/blocks";
import { ProductForm } from "@/components/shared/product-form";
import { LockedFeature } from "@/components/seller/locked-feature";
import { getCategories, getCurrentSeller, getSubcategoryMap, resolveSellerId } from "@/lib/data";

export const metadata = { title: "Add product" };

export default async function SellerNewProductPage() {
  const me = await getCurrentSeller();
  if (me && me.status === "active" && !me.permissions.add_products) return <LockedFeature feature="Adding products" />;
  return (
    <>
      <PageHeader title="Add a product" subtitle="Great photos and clear details sell faster" back={{ href: "/seller/products", label: "Products" }} />
      <ProductForm categories={await getCategories()} subcategories={await getSubcategoryMap()} base="/seller" role="seller" canPublish={me?.permissions.publish_directly ?? false} sellerId={(await resolveSellerId()) ?? undefined} />
    </>
  );
}
