import { OrderConfirmed } from "@/components/store/order-confirmed";

export const metadata = { title: "Order confirmed" };

export default async function OrderConfirmedPage({ params }: PageProps<"/order-confirmed/[id]">) {
  return <OrderConfirmed number={(await params).id} />;
}
