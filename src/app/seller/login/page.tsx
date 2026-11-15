import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { LoginForm } from "@/components/shared/auth-forms";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "Seller sign in" };

export default async function SellerLoginPage({ searchParams }: PageProps<"/seller/login">) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "");
  return (
    <AuthShell variant="seller" title="Welcome back, seller" subtitle="Sign in to manage orders, products and payouts."
      footer={<>New to ManaBrand? <Link href="/seller/register" className="font-semibold text-fg underline underline-offset-4">Start selling</Link></>}>
      <LoginForm mode="staff" area="seller" next={next || undefined} forgotHref="/forgot-password?staff=seller" />
    </AuthShell>
  );
}
