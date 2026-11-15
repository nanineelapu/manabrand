"use client";

import {
  BarChart3, Boxes, Home, LifeBuoy, Megaphone, MessageSquareText, Package, RotateCcw, ShoppingBag, Store, Wallet,
} from "lucide-react";
import { AppShell, type ShellConfig } from "@/components/shared/app-shell";
import type { AppNotification } from "@/types";

export function SellerShell({ notifications, badges, seller, children }: { notifications: AppNotification[]; badges: { orders: number; returns: number }; seller: { name: string; owner: string; slug: string; status: string }; children: React.ReactNode }) {
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
      {seller.status !== "active" && (
        <p role="status" className="mb-4 border-l-4 border-gold-500 bg-gold-500/15 px-4 py-3 text-sm">
          <b>{seller.status === "pending" ? "Your store is awaiting approval." : "Your store is not active."}</b>{" "}
          {seller.status === "pending" ? "You can complete your profile and upload documents now — you’ll be able to list products as soon as the ManaBrand team approves you." : "Contact support if you think this is a mistake."}
        </p>
      )}
      {children}
    </AppShell>
  );
}
