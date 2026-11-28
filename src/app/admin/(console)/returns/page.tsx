import { PageHeader } from "@/components/shared/blocks";
import { ReturnsView } from "@/components/shared/returns-view";
import { getAllReturns } from "@/lib/data";

export const metadata = { title: "Exchanges" };

export default async function ReturnsPage() {
  const r = await getAllReturns();
  return (
    <>
      <PageHeader title="Exchanges" subtitle={`${r.filter((x) => x.status === "requested").length} exchange requests need a decision`} />
      <ReturnsView returns={r} />
    </>
  );
}
