import { PageHeader } from "@/components/shared/blocks";
import { PayoutsView } from "@/components/shared/payouts-view";
import { getAllPayouts } from "@/lib/data";

export const metadata = { title: "Payouts" };

export default async function PayoutsPage() {
  return (
    <>
      <PageHeader title="Seller payouts" subtitle="Settled twice a month · T+2 after cycle close" />
      <PayoutsView payouts={await getAllPayouts()} role="admin" />
    </>
  );
}
