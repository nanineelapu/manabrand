import { Suspense } from "react";
import { PageHeader } from "@/components/shared/blocks";
import { SellersList } from "@/components/admin/sellers-list";
import { getAllSellers } from "@/lib/data";

export const metadata = { title: "Sellers" };

export default async function SellersPage() {
  const sellers = await getAllSellers();
  return (
    <>
      <PageHeader title="Sellers" subtitle={`${sellers.filter((s) => s.status === "pending").length} applications waiting for review`} />
      <Suspense><SellersList sellers={sellers} /></Suspense>
    </>
  );
}
