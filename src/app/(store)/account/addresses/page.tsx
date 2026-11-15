import { AccountPageHeader } from "@/components/store/account-nav";
import { AddressesManager } from "@/components/store/addresses-manager";
import { getMyAddresses } from "@/lib/data";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  return (
    <>
      <AccountPageHeader title="Addresses" subtitle="Where should we deliver?" />
      <AddressesManager initial={await getMyAddresses()} />
    </>
  );
}
