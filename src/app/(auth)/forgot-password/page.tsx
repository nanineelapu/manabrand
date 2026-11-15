import { AuthShell } from "@/components/shared/auth-shell";
import { ForgotForm } from "@/components/shared/auth-forms";

export const metadata = { title: "Reset PIN" };

export default async function ForgotPage({ searchParams }: PageProps<"/forgot-password">) {
  const sp = await searchParams;
  const staff = Array.isArray(sp.staff) ? sp.staff[0] : sp.staff;
  const back = staff === "admin" ? "/admin/login" : staff === "seller" ? "/seller/login" : "/login";
  return (
    <AuthShell variant={staff === "admin" ? "admin" : staff === "seller" ? "seller" : "customer"}
      title={staff ? "Reset your password" : "Forgot your PIN?"}
      subtitle={staff ? "Enter your work email and we will send a reset link." : "Enter the email you registered with. We will send a secure link to set a new PIN."}>
      <ForgotForm backHref={back} staff={!!staff} expired={sp.expired === "1"} />
    </AuthShell>
  );
}
