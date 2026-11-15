"use client";

import {
  BarChart3, Boxes, ImageIcon, LayoutDashboard, MessageSquareWarning, Package, RotateCcw, Settings, ShoppingCart,
  Store, Tag, TicketPercent, Users, Wallet, PenSquare,
} from "lucide-react";
import { AppShell, type ShellConfig } from "@/components/shared/app-shell";
import type { AppNotification } from "@/types";

export function AdminShell({ notifications, badges, children }: { notifications: AppNotification[]; badges: { orders: number; sellers: number; returns: number; reviews: number }; children: React.ReactNode }) {
  const cfg: ShellConfig = {
    surface: "admin", base: "/admin",
    user: { name: "Aarav Kulkarni", role: "Super admin" },
    searchPlaceholder: "Search orders, customers, SKUs…", searchTarget: "/admin/orders",
    viewSite: { href: "/", label: "View storefront" },
    groups: [
      { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }, { href: "/admin/analytics", label: "Analytics", icon: BarChart3 }] },
      { label: "Commerce", items: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: badges.orders },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/categories", label: "Categories", icon: Boxes },
        { href: "/admin/customers", label: "Customers", icon: Users },
      ]},
      { label: "Marketplace", items: [
        { href: "/admin/sellers", label: "Sellers", icon: Store, badge: badges.sellers },
        { href: "/admin/payouts", label: "Payouts", icon: Wallet },
        { href: "/admin/returns", label: "Returns", icon: RotateCcw, badge: badges.returns },
        { href: "/admin/reviews", label: "Reviews", icon: MessageSquareWarning, badge: badges.reviews },
      ]},
      { label: "Marketing", items: [{ href: "/admin/coupons", label: "Coupons", icon: TicketPercent }, { href: "/admin/banners", label: "Banners", icon: ImageIcon }, { href: "/admin/content", label: "Site content", icon: PenSquare }] },
      { label: "System", items: [{ href: "/admin/settings", label: "Settings", icon: Settings }] },
    ],
    tabs: [
      { href: "/admin", label: "Home", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: badges.orders },
      { href: "/admin/products", label: "Products", icon: Tag },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  };
  return <AppShell cfg={cfg} notifications={notifications}>{children}</AppShell>;
}
