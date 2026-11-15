import { notFound } from "next/navigation";
import { OrderManager } from "@/components/admin/order-detail";
import { PageHeader } from "@/components/shared/blocks";
import { getOrderByIdOrNumber } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">) {
  const o = await getOrderByIdOrNumber((await params).id);
  return { title: o ? `Order ${o.number}` : "Order" };
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const o = await getOrderByIdOrNumber((await params).id);
  if (!o) notFound();
  return (
    <>
      <PageHeader title="Order details" back={{ href: "/admin/orders", label: "Orders" }} />
      <OrderManager order={o} base="/admin" role="admin" />
    </>
  );
}
