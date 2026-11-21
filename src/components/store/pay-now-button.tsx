"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { payWithRazorpay } from "@/lib/payments/client";
import { toast } from "@/lib/stores";

/** "Pay now" for an order whose online payment is still pending (e.g. the payment window was closed). */
export function PayNowButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <Button size="sm" loading={busy} onClick={async () => {
      setBusy(true);
      const r = await payWithRazorpay(orderId);
      setBusy(false);
      if (r.status === "paid") { toast.success("Payment received — thank you!"); router.refresh(); }
      else if (r.status === "error") toast.error(r.message);
    }}><CreditCard className="size-4" /> Pay now</Button>
  );
}
