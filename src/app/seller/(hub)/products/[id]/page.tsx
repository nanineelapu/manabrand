import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/blocks";
import { ProductForm } from "@/components/shared/product-form";
import { StatusBadge } from "@/components/shared/status";
import { LockedFeature } from "@/components/seller/locked-feature";
import { getCategories, getCurrentSeller, getProductById, getSubcategoryMap, resolveSellerId } from "@/lib/data";

export default async function SellerEditProductPage({ params }: PageProps<"/seller/products/[id]">) {
  const p = await getProductById((await params).id);
  const sellerId = await resolveSellerId();
  if (!p || p.sellerId !== sellerId) notFound();
  const me = await getCurrentSeller();
  if (me && !me.permissions.add_products) return <LockedFeature feature="Editing products" />;
  return (
    <>
      <PageHeader title={p.name} subtitle={`SKU ${p.id.toUpperCase()} · ${p.sold} sold`} back={{ href: "/seller/products", label: "Products" }} actions={<StatusBadge status={p.status} />} />
      <ProductForm product={p} categories={await getCategories()} subcategories={await getSubcategoryMap()} base="/seller" role="seller" canPublish={me?.permissions.publish_directly ?? false} sellerId={sellerId} />
    </>
  );
}
