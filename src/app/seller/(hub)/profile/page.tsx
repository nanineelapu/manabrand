import { StoreProfile } from "@/components/seller/store-profile";
import { PageHeader } from "@/components/shared/blocks";
import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/lib/data";

export const metadata = { title: "Store profile" };

export default async function SellerProfilePage() {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/seller/login");
  return (
    <>
      <PageHeader title="Store profile" subtitle="How shoppers see you on ManaBrand" />
      <StoreProfile seller={seller} />
    </>
  );
}
