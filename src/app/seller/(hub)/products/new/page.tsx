import { PageHeader } from "@/components/shared/blocks";
import { ProductForm } from "@/components/shared/product-form";
import { getCategories, getSubcategoryMap, resolveSellerId } from "@/lib/data";

export const metadata = { title: "Add product" };

export default async function SellerNewProductPage() {
  return (
    <>
      <PageHeader title="Add a product" subtitle="Great photos and clear details sell faster" back={{ href: "/seller/products", label: "Products" }} />
      <ProductForm categories={await getCategories()} subcategories={await getSubcategoryMap()} base="/seller" role="seller" sellerId={(await resolveSellerId()) ?? undefined} />
    </>
  );
}
