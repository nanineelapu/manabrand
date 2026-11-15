"use client";

import {
  BarChart3, Boxes, Home, LifeBuoy, Megaphone, MessageSquareText, Package, RotateCcw, ShoppingBag, Store, Wallet,
} from "lucide-react";
import { AppShell, type ShellConfig } from "@/components/shared/app-shell";
import type { AppNotification } from "@/types";

/** Where the seller is in the approval process: Submitted → Documents → Approved. */
function ApplicationTracker({ status, kyc }: { status: string; kyc?: string }) {
  const blocked = status !== "pending";
  const docsDone = kyc === "verified";
  const steps = [
    { t: "Application submitted", d: "We have your business details.", done: true },
    { t: "Documents reviewed", d: docsDone ? "Your documents are verified." : kyc === "rejected" ? "A document was rejected — re-upload it in Store profile." : "Upload PAN and bank proof in Store profile → Verification.", done: docsDone },
    { t: "Approved to sell", d: blocked ? "Your store is not active. Contact support." : "You can list products as soon as we approve you.", done: false },
  ];
  const current = steps.findIndex((x) => !x.done);
  return (
    <section aria-label="Application status" className="mb-5 border border-line bg-card p-4 md:p-5">
      <p className="text-sm font-semibold">{blocked ? "Your store is not active" : "Your application is under review"}</p>
      <ol className="mt-3 grid gap-3 md:grid-cols-3">
        {steps.map((x, i) => (
          <li key={x.t} className="flex items-start gap-3">
            <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${x.done ? "bg-success text-white" : i === current ? "bg-accent text-accent-fg" : "bg-bg-subtle text-muted"}`}>{x.done ? "✓" : i + 1}</span>
            <span className="text-sm"><b className="block">{x.t}</b><span className="text-muted">{x.d}</span></span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SellerShell({ notifications, badges, seller, children }: { notifications: AppNotification[]; badges: { orders: number; returns: number }; seller: { name: string; owner: string; slug: string; status: string; kyc?: string }; children: React.ReactNode }) {
  const cfg: ShellConfig = {
    surface: "seller", base: "/seller",
    user: { name: seller.owner, role: seller.name },
    searchPlaceholder: "Search your orders…", searchTarget: "/seller/orders",
    storeToggle: true, fab: { href: "/seller/products/new", label: "Add product" },
    viewSite: { href: `/sellers/${seller.slug}`, label: "View my storefront" },
    groups: [
      { items: [{ href: "/seller", label: "Home", icon: Home }] },
      { label: "Sell", items: [
        { href: "/seller/orders", label: "Orders", icon: ShoppingBag, badge: badges.orders },
        { href: "/seller/products", label: "Products", icon: Package },
        { href: "/seller/inventory", label: "Inventory", icon: Boxes },
        { href: "/seller/returns", label: "Returns", icon: RotateCcw, badge: badges.returns },
      ]},
      { label: "Grow", items: [
        { href: "/seller/promotions", label: "Promotions", icon: Megaphone },
        { href: "/seller/reviews", label: "Reviews", icon: MessageSquareText },
        { href: "/seller/analytics", label: "Analytics", icon: BarChart3 },
      ]},
      { label: "Money & store", items: [
        { href: "/seller/earnings", label: "Earnings", icon: Wallet },
        { href: "/seller/profile", label: "Store profile", icon: Store },
        { href: "/seller/support", label: "Help & support", icon: LifeBuoy },
      ]},
    ],
    tabs: [
      { href: "/seller", label: "Home", icon: Home },
      { href: "/seller/orders", label: "Orders", icon: ShoppingBag, badge: badges.orders },
      { href: "/seller/products", label: "Products", icon: Package },
      { href: "/seller/earnings", label: "Earnings", icon: Wallet },
    ],
  };
  return (
    <AppShell cfg={cfg} notifications={notifications}>
      {seller.status !== "active" && <ApplicationTracker status={seller.status} kyc={seller.kyc} />}
      {children}
    </AppShell>
  );
}
