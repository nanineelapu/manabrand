import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/store/order-detail";
import { getOrderByIdOrNumber } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/account/orders/[id]">) {
  const o = await getOrderByIdOrNumber((await params).id);
  return { title: o ? `Order ${o.number}` : "Order" };
}

export default async function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const o = await getOrderByIdOrNumber((await params).id);
  if (!o) notFound();
  return (
    <>
      <Link href="/account/orders" className="mb-3 inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg">← All orders</Link>
      <OrderDetail order={o} />
    </>
  );
}
