import { AccountPageHeader } from "@/components/store/account-nav";
import { ProfileForm } from "@/components/store/profile-form";
import { getCurrentCustomer } from "@/lib/data";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const me = await getCurrentCustomer();
  return (
    <>
      <AccountPageHeader title="Profile & security" subtitle="Keep your details up to date" />
      <ProfileForm initial={{ name: me.name, email: me.email, phone: me.phone }} />
    </>
  );
}
