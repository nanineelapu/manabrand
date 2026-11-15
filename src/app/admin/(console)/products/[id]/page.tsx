import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/blocks";
import { StatusBadge } from "@/components/shared/status";
import { ProductForm } from "@/components/shared/product-form";
import { getActiveSellers, getCategories, getProductById, getSubcategoryMap } from "@/lib/data";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const p = await getProductById((await params).id);
  if (!p) notFound();
  const [categories, sellers] = await Promise.all([getCategories(), getActiveSellers()]);
  return (
    <>
      <PageHeader title={p.name} subtitle={`SKU ${p.id.toUpperCase()} · ${p.sold} sold`} back={{ href: "/admin/products", label: "Products" }} actions={<StatusBadge status={p.status} />} />
      <ProductForm product={p} categories={categories} subcategories={await getSubcategoryMap()} base="/admin" role="admin" sellers={sellers.map((s) => ({ id: s.id, name: s.name }))} />
    </>
  );
}
