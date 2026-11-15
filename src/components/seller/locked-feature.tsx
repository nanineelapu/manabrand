import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown when the admin has not switched a feature on for this seller. */
export function LockedFeature({ feature, what }: { feature: string; what?: string }) {
  return (
    <div className="mx-auto grid max-w-lg place-items-center border border-line bg-card px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-bg-subtle"><Lock className="size-6 text-muted" /></span>
      <h2 className="mt-4 text-lg font-semibold">{feature} is not enabled for your store</h2>
      <p className="mt-1.5 text-sm text-muted">{what ?? "The ManaBrand team controls what each seller can do."} Contact support and we will switch it on once you are ready.</p>
      <Button href="/seller/support" className="mt-5">Contact support</Button>
    </div>
  );
}
