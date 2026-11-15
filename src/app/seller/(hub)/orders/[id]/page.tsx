import { notFound } from "next/navigation";
import { OrderManager } from "@/components/admin/order-detail";
import { PageHeader } from "@/components/shared/blocks";
import { getOrdersForSeller } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/seller/orders/[id]">) {
  const { id } = await params;
  const o = (await getOrdersForSeller()).find((x) => x.id === id);
  return { title: o ? `Order ${o.number}` : "Order" };
}

export default async function SellerOrderPage({ params }: PageProps<"/seller/orders/[id]">) {
  const { id } = await params;
  const o = (await getOrdersForSeller()).find((x) => x.id === id);
  if (!o) notFound();
  return (
    <>
      <PageHeader title="Order details" back={{ href: "/seller/orders", label: "Orders" }} />
      <OrderManager order={o} base="/seller" role="seller" />
    </>
  );
}
