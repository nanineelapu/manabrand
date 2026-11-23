"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Heart, LogOut, MapPin, Package, User, LifeBuoy, Wallet } from "lucide-react";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { cn } from "@/lib/utils";

export const accountLinks = [
  { href: "/account/orders", label: "My orders", icon: Package, hint: "Track or buy again" },
  { href: "/account/wallet", label: "Wallet", icon: Wallet, hint: "Balance and history" },
  { href: "/wishlist", label: "Wishlist", icon: Heart, hint: "Pieces you’ve saved" },
  { href: "/account/addresses", label: "Addresses", icon: MapPin, hint: "Manage delivery addresses" },
  { href: "/account/profile", label: "Profile & security", icon: User, hint: "Name, email, phone" },
  { href: "/contact", label: "Help & support", icon: LifeBuoy, hint: "We reply within 24 hours" },
];

/** Desktop sidebar */
export function AccountSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="hidden w-64 shrink-0 lg:block">
      <ul className="sticky top-24 space-y-1">
        {accountLinks.map(({ href, label, icon: I }) => {
          const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-12 items-center gap-3 rounded-ctl px-4 text-sm font-medium transition-colors", active ? "bg-primary text-primary-fg" : "hover:bg-bg-subtle")}>
                <I className="size-[18px]" />{label}
              </Link>
            </li>
          );
        })}
        <li><SignOutButton className="flex h-12 w-full items-center gap-3 px-4 text-sm font-medium text-danger hover:bg-danger-bg"><LogOut className="size-[18px]" /> Sign out</SignOutButton></li>
      </ul>
    </nav>
  );
}

/** Mobile hub list */
export function AccountMenuList() {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card shadow-card lg:hidden">
      {accountLinks.map(({ href, label, icon: I, hint }) => (
        <li key={href}>
          <Link href={href} className="flex min-h-16 items-center gap-4 px-4 active:bg-bg-subtle">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bg-subtle"><I className="size-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{label}</span><span className="block truncate text-xs text-muted">{hint}</span></span>
            <ChevronRight className="size-4 text-subtle" />
          </Link>
        </li>
      ))}
      <li><SignOutButton className="flex min-h-14 w-full items-center gap-4 px-4 text-danger"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-bg"><LogOut className="size-5" /></span><span className="text-[15px] font-medium">Sign out</span></SignOutButton></li>
    </ul>
  );
}

/** Mobile back header for account sub-pages */
export function AccountPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <Link href="/account" className="mb-1 inline-flex items-center gap-1 text-[13px] text-muted lg:hidden">← Account</Link>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
