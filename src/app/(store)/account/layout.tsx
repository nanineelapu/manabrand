import { AccountSidebar } from "@/components/store/account-nav";

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-page flex gap-12 pb-6 pt-5 md:pt-10">
      <AccountSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
