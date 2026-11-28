import { redirect } from "next/navigation";
import { onlinePaymentsLive } from "@/lib/payments/razorpay";
import { CheckoutFlow } from "@/components/store/checkout-flow";
import { getMyAddresses, getWallet } from "@/lib/data";
import { getSessionProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;
  const buyNow = (Array.isArray(sp.buy) ? sp.buy[0] : sp.buy) === "1";   // /checkout?buy=1 = Buy now: that one item only
  // ordering needs an account: sign in or register first (the bag and the Buy now item are kept, so nothing is lost)
  if (!(await getSessionProfile())) redirect(`/login?next=${encodeURIComponent(buyNow ? "/checkout?buy=1" : "/checkout")}`);
  // Real orders: cash on delivery only, until a payment gateway is connected (PAYMENT_MODE=live). The demo (no database) shows every method.
  const gateway = isSupabaseConfigured() && onlinePaymentsLive();   // Razorpay collects the card / UPI / bank details itself
  const onlinePayments = !isSupabaseConfigured() || gateway;
  const wallet = await getWallet();
  return <CheckoutFlow buyNow={buyNow} addresses={await getMyAddresses()} onlinePayments={onlinePayments} gateway={gateway} walletBalance={wallet.balance} />;
}
