import Link from "next/link";
import { AuthShell } from "@/components/shared/auth-shell";
import { ResetForm } from "@/components/shared/auth-forms";
import { getSessionProfile } from "@/lib/auth/session";

export const metadata = { title: "Set a new PIN" };

export default async function ResetPinPage() {
  const me = await getSessionProfile();
  if (!me) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link is no longer valid.">
        <Link href="/forgot-password" className="font-semibold underline underline-offset-4">Request a new link</Link>
      </AuthShell>
    );
  }
  const pin = me.role === "customer";
  return (
    <AuthShell variant={me.role === "admin" ? "admin" : me.role === "seller" ? "seller" : "customer"}
      title={pin ? "Set a new PIN" : "Set a new password"}
      subtitle={pin ? `Hi ${me.name.split(" ")[0]}, choose a new 6-digit PIN for ${me.phone}.` : `Choose a new password for ${me.email}.`}>
      <ResetForm kind={pin ? "pin" : "password"} />
    </AuthShell>
  );
}
