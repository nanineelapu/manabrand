import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { LoginForm } from "@/components/shared/auth-forms";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "");
  return (
    <AuthShell variant="admin" title="Admin console" subtitle="Sign in with your ManaBrand staff account."
      footer={<Link href="/" className="underline underline-offset-4">Back to storefront</Link>}>
      <LoginForm mode="staff" area="admin" next={next || undefined} forgotHref="/forgot-password?staff=admin" />
    </AuthShell>
  );
}
