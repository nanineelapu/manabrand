import { Suspense } from "react";
import { OrdersList } from "@/components/admin/orders-list";
import { PageHeader } from "@/components/shared/blocks";
import { getAllOrders } from "@/lib/data";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  return (
    <>
      <PageHeader title="Orders" subtitle={`${orders.length} orders across all sellers`} />
      <Suspense><OrdersList orders={orders} /></Suspense>
    </>
  );
}
