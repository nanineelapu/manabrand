import { PageHeader } from "@/components/shared/blocks";
import { ReturnsView } from "@/components/shared/returns-view";
import { getAllReturns } from "@/lib/data";

export const metadata = { title: "Returns" };

export default async function ReturnsPage() {
  const r = await getAllReturns();
  return (
    <>
      <PageHeader title="Returns & exchanges" subtitle={`${r.filter((x) => x.status === "requested").length} requests need a decision`} />
      <ReturnsView returns={r} />
    </>
  );
}
