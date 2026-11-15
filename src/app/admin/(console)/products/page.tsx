import { Suspense } from "react";
import { PageHeader } from "@/components/shared/blocks";
import { ProductsList } from "@/components/shared/products-list";
import { getAllProducts, getAllSellers } from "@/lib/data";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const [products, sellers] = await Promise.all([getAllProducts(), getAllSellers()]);
  return (
    <>
      <PageHeader title="Products" subtitle={`${products.length} products from ${sellers.filter((s) => s.status === "active").length} sellers`} />
      <Suspense><ProductsList products={products} base="/admin" showSeller sellerNames={Object.fromEntries(sellers.map((s) => [s.id, s.name]))} /></Suspense>
    </>
  );
}
