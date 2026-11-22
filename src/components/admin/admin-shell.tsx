"use client";

import {
  Boxes, ImageIcon, LayoutDashboard, MessageSquareWarning, Package, RotateCcw, Settings, ShoppingCart,
  Store, Layers, Tag, TicketPercent, TrendingUp, Users, Wallet, PenSquare, Warehouse, Gift, ShieldCheck,
} from "lucide-react";
import { AppShell, type ShellConfig } from "@/components/shared/app-shell";
import type { AppNotification } from "@/types";

export function AdminShell({ notifications, badges, user, children }: { notifications: AppNotification[]; badges: { orders: number; sellers: number; returns: number; reviews: number }; user?: { name: string; role: string }; children: React.ReactNode }) {
  const cfg: ShellConfig = {
    surface: "admin", base: "/admin",
    user: user ?? { name: "Admin", role: "Administrator" },
    searchPlaceholder: "Search orders, customers, SKUs…", searchTarget: "/admin/search",
    viewSite: { href: "/", label: "View storefront" },
    groups: [
      { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }, { href: "/admin/business", label: "Business analysis", icon: TrendingUp }] },
      { label: "Commerce", items: [
        { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: badges.orders },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
        { href: "/admin/categories", label: "Categories", icon: Boxes },
        { href: "/admin/collections", label: "Collections", icon: Layers },
        { href: "/admin/customers", label: "Customers", icon: Users },
      ]},
      { label: "Marketplace", items: [
        { href: "/admin/sellers", label: "Sellers", icon: Store, badge: badges.sellers },
        { href: "/admin/payouts", label: "Payouts", icon: Wallet },
        { href: "/admin/returns", label: "Returns", icon: RotateCcw, badge: badges.returns },
        { href: "/admin/reviews", label: "Reviews", icon: MessageSquareWarning, badge: badges.reviews },
      ]},
      { label: "Marketing", items: [{ href: "/admin/coupons", label: "Coupons", icon: TicketPercent }, { href: "/admin/banners", label: "Banners", icon: ImageIcon }, { href: "/admin/deal-box", label: "Deal Box", icon: Gift }, { href: "/admin/content", label: "Site content", icon: PenSquare }] },
      { label: "System", items: [{ href: "/admin/team", label: "Team", icon: ShieldCheck }, { href: "/admin/settings", label: "Settings", icon: Settings }] },
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
