import { PageHeader } from "@/components/shared/blocks";
import { ReturnsView } from "@/components/shared/returns-view";
import { getSellerReturns } from "@/lib/data";

export const metadata = { title: "Exchanges" };

export default async function SellerReturnsPage() {
  const r = await getSellerReturns();
  return (
    <>
      <PageHeader title="Exchanges" subtitle={r.length ? "Reply within 48 hours to protect your seller score" : "No exchange requests"} />
      <ReturnsView returns={r} />
    </>
  );
}
