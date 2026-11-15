import { redirect } from "next/navigation";
import { SellerShell } from "@/components/seller/seller-shell";
import { getCurrentSeller, getNotifications, getSellerDashboard } from "@/lib/data";

/** (hub) group = everything in /seller except login & register. src/proxy.ts already requires a seller session. */
export default async function SellerLayout({ children }: LayoutProps<"/seller">) {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/seller/login");
  const [notifications, d] = await Promise.all([getNotifications(), getSellerDashboard(seller.id)]);
  return (
    <SellerShell seller={{ name: seller.name, owner: seller.owner, slug: seller.slug, status: seller.status, kyc: seller.kyc }} notifications={notifications.filter((n) => n.kind !== "seller").slice(0, 5)} badges={{ orders: d.toConfirm + d.toPack, returns: d.returnsOpen }}>
      {children}
    </SellerShell>
  );
}
