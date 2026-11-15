import { SupportCenter } from "@/components/seller/support-center";
import { PageHeader } from "@/components/shared/blocks";
import { getSellerTickets } from "@/lib/data";

export const metadata = { title: "Help & support" };

export default async function SellerSupportPage() {
  return (
    <>
      <PageHeader title="Help & support" subtitle="We’re here Mon–Sat, 9am–8pm. Seller tickets are answered within 4 hours." />
      <SupportCenter initial={await getSellerTickets()} />
    </>
  );
}
