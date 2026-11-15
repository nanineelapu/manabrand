import { CheckoutFlow } from "@/components/store/checkout-flow";
import { getMyAddresses } from "@/lib/data";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  return <CheckoutFlow addresses={await getMyAddresses()} />;
}
