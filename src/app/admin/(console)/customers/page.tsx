import { Suspense } from "react";
import { CustomersList } from "@/components/admin/customers-list";
import { PageHeader } from "@/components/shared/blocks";
import { getAllCustomers } from "@/lib/data";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const customers = await getAllCustomers();
  return (
    <>
      <PageHeader title="Customers" subtitle={`${customers.length} registered shoppers`} />
      <Suspense><CustomersList customers={customers} /></Suspense>
    </>
  );
}
