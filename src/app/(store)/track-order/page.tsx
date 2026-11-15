import { Search } from "lucide-react";
import { OrderDetail } from "@/components/store/order-detail";
import { Breadcrumb } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/session";
import { getOrderByIdOrNumber } from "@/lib/data";

export const metadata = { title: "Track your order" };

export default async function TrackOrderPage({ searchParams }: PageProps<"/track-order">) {
  const sp = await searchParams;
  const raw = (Array.isArray(sp.id) ? sp.id[0] : sp.id)?.trim().toUpperCase();
  const session = await getSessionProfile();
  // orders are private: only a signed-in shopper can look up their own
  const order = raw && session ? await getOrderByIdOrNumber(raw.startsWith("MB-") ? raw : `MB-${raw}`) : undefined;

  return (
    <div className="container-page max-w-4xl pb-6 pt-4 md:pt-8">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Track order" }]} />
      <h1 className="mt-4 font-display text-[32px] font-semibold tracking-tight md:text-5xl">Track your order</h1>
      <p className="mt-1.5 text-sm text-muted md:text-base">Enter your order number (you can find it under My orders). Sign in first to see your own orders.</p>
      <form className="mt-6 flex gap-2.5" action="/track-order">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle" />
          <input name="id" defaultValue={raw} placeholder="Order number, e.g. MB-10500" aria-label="Order number" className="h-12 w-full rounded-ctl border border-line-strong bg-card pl-10 pr-3 text-[15px] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
        </div>
        <Button type="submit" size="lg">Track</Button>
      </form>
      <div className="mt-8">
        {!session && <p role="status" className="rounded-card bg-bg-subtle p-5 text-sm">Please <Link href="/login?next=/track-order" className="font-semibold underline underline-offset-4">sign in</Link> to track your orders.</p>}
        {session && raw && !order && <p role="alert" className="rounded-card bg-danger-bg p-5 text-sm text-danger">We couldn’t find an order matching “{raw}”. Check the number and try again.</p>}
        {order && <OrderDetail order={order} />}
      </div>
    </div>
  );
}
