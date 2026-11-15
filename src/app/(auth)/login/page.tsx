import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { LoginForm } from "@/components/shared/auth-forms";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "");
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthShell title="Welcome back" subtitle="Sign in with your mobile number and 6-digit PIN."
      footer={<>New to ManaBrand? <Link href={`/register${nextQs}`} className="font-semibold text-fg underline underline-offset-4">Create an account</Link></>}>
      <LoginForm mode="customer" next={next || undefined} />
    </AuthShell>
  );
}
