import { redirect } from "next/navigation";
import { AccountSidebar } from "@/components/store/account-nav";
import { getSessionProfile } from "@/lib/auth/session";

/** Everything under /account belongs to a signed-in shopper. No session (or no database connected yet) -> sign in / register first. */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  if (!(await getSessionProfile())) redirect("/login?next=/account");
  return (
    <div className="container-page flex gap-12 pb-6 pt-5 md:pt-10">
      <AccountSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
