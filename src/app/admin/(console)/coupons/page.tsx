import { CouponsManager } from "@/components/admin/coupons-manager";
import { PageHeader } from "@/components/shared/blocks";
import { getAllCoupons } from "@/lib/data";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  return (
    <>
      <PageHeader title="Coupons & offers" subtitle="Drive conversions with codes shoppers can apply at checkout" />
      <CouponsManager coupons={await getAllCoupons()} />
    </>
  );
}
