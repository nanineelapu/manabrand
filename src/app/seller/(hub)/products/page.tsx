import { Suspense } from "react";
import { PageHeader } from "@/components/shared/blocks";
import { ProductsList } from "@/components/shared/products-list";
import { getSellerProducts } from "@/lib/data";

export const metadata = { title: "Products" };

export default async function SellerProductsPage() {
  const products = await getSellerProducts();
  return (
    <>
      <PageHeader title="My products" subtitle={`${products.length} listings · ${products.filter((p) => p.status === "active").length} live`} />
      <Suspense><ProductsList products={products} base="/seller" /></Suspense>
    </>
  );
}
