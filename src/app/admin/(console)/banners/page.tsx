import { BannersManager } from "@/components/admin/banners-manager";
import { PageHeader } from "@/components/shared/blocks";
import { getAllBanners } from "@/lib/data";

export const metadata = { title: "Banners" };

export default async function BannersPage() {
  return (
    <>
      <PageHeader title="Homepage banners" subtitle="Schedule and publish what shoppers see first" />
      <BannersManager banners={await getAllBanners()} />
    </>
  );
}
