import { redirect } from "next/navigation";
import { onlinePaymentsLive } from "@/lib/payments/razorpay";
import { CheckoutFlow } from "@/components/store/checkout-flow";
import { getMyAddresses, getWallet } from "@/lib/data";
import { getSessionProfile } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  // ordering needs an account: sign in or register first (the bag is kept, so nothing is lost)
  if (!(await getSessionProfile())) redirect("/login?next=/checkout");
  // Real orders: cash on delivery only, until a payment gateway is connected (PAYMENT_MODE=live). The demo (no database) shows every method.
  const gateway = isSupabaseConfigured() && onlinePaymentsLive();   // Razorpay collects the card / UPI / bank details itself
  const onlinePayments = !isSupabaseConfigured() || gateway;
  const wallet = await getWallet();
  return <CheckoutFlow addresses={await getMyAddresses()} onlinePayments={onlinePayments} gateway={gateway} walletBalance={wallet.balance} />;
}
