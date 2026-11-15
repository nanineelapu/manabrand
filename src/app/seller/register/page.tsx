import { RegisterWizard } from "@/components/seller/register-wizard";
import { Toaster } from "@/components/ui/toaster";

export const metadata = { title: "Sell on ManaBrand" };

export default function SellerRegisterPage() {
  return (
    <div data-surface="seller" className="min-h-dvh bg-bg text-fg">
      <RegisterWizard />
      <Toaster />
    </div>
  );
}
