import { Suspense } from "react";
import { OrdersList } from "@/components/admin/orders-list";
import { PageHeader } from "@/components/shared/blocks";
import { getOrdersForSeller } from "@/lib/data";

export const metadata = { title: "Orders" };

export default async function SellerOrdersPage() {
  const orders = await getOrdersForSeller();
  return (
    <>
      <PageHeader title="Orders" subtitle="Confirm, pack and ship — fast shipping earns you a Top Maker badge" />
      <Suspense><OrdersList orders={orders} base="/seller" showCustomer={false} /></Suspense>
    </>
  );
}
