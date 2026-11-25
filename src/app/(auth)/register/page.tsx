import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { RegisterForm } from "@/components/shared/auth-forms";
import { safeNext } from "@/lib/auth/validation";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, "");
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthShell title="Create your account" subtitle="Join ManaBrand today and receive ₹500 in your wallet to use on orders above ₹999. Your mobile number is your login."
      footer={<>Already have an account? <Link href={`/login${nextQs}`} className="font-semibold text-fg underline underline-offset-4">Sign in</Link></>}>
      <RegisterForm next={next || undefined} />
    </AuthShell>
  );
}
