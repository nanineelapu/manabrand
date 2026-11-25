import { CartView } from "@/components/store/cart-view";
import { getSessionProfile } from "@/lib/auth/session";
import { getWallet } from "@/lib/data";

export const metadata = { title: "Your bag" };

export default async function CartPage() {
  const [session, wallet] = await Promise.all([getSessionProfile(), getWallet()]);
  return <CartView isGuest={!session} walletBalance={wallet.balance} />;
}
