import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { RegisterForm } from "@/components/shared/auth-forms";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "");
  return (
    <AuthShell title="Create your account" subtitle="Your mobile number is your login. Your email is for updates and PIN reset. Join today and get ₹500 in your wallet."
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-fg underline underline-offset-4">Sign in</Link></>}>
      <RegisterForm next={next || undefined} />
    </AuthShell>
  );
}
