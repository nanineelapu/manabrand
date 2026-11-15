import { PageHeader } from "@/components/shared/blocks";
import { ProductForm } from "@/components/shared/product-form";
import { getActiveSellers, getCategories, getSubcategoryMap } from "@/lib/data";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, sellers] = await Promise.all([getCategories(), getActiveSellers()]);
  return (
    <>
      <PageHeader title="Add product" subtitle="Create a listing on behalf of a seller" back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm categories={categories} subcategories={await getSubcategoryMap()} base="/admin" role="admin" sellers={sellers.map((s) => ({ id: s.id, name: s.name }))} />
    </>
  );
}
