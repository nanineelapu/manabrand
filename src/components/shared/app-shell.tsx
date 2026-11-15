"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronsLeft, ChevronsRight, ExternalLink, LogOut, Menu, MoreHorizontal, Plus, Search, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/display";
import { IconButton } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/form";
import { Toaster } from "@/components/ui/toaster";
import { markNotificationsRead } from "@/lib/actions/manage";
import { toast } from "@/lib/stores";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { cn, timeAgo } from "@/lib/utils";
import type { AppNotification } from "@/types";

export interface NavItem { href: string; label: string; icon: LucideIcon; badge?: number }
export interface NavGroup { label?: string; items: NavItem[] }

export interface ShellConfig {
  surface: "admin" | "seller";
  base: string;               // "/admin" | "/seller"
  groups: NavGroup[];
  tabs: NavItem[];            // mobile bottom tabs (max 4; 5th is "More")
  user: { name: string; role: string };
  searchPlaceholder: string;
  searchTarget: string;       // route that receives ?q=
  fab?: { href: string; label: string };
  storeToggle?: boolean;
  viewSite?: { href: string; label: string };
}

const isActive = (base: string, pathname: string, href: string) => (href === base ? pathname === base : pathname === href || pathname.startsWith(`${href}/`));

function NavList({ cfg, onNavigate, collapsed, rail }: { cfg: ShellConfig; onNavigate?: () => void; collapsed?: boolean; rail?: boolean }) {
  const pathname = usePathname();
  const dark = cfg.surface === "admin" && rail !== false;
  return (
    <nav aria-label="Main" className="space-y-5">
      {cfg.groups.map((g, gi) => (
        <div key={gi}>
          {g.label && !collapsed && <p className={cn("mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em]", dark ? "text-rail-muted" : "text-subtle")}>{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = isActive(cfg.base, pathname, it.href);
              return (
                <li key={it.href}>
                  <Link href={it.href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={collapsed ? it.label : undefined}
                    className={cn("group relative flex h-11 items-center gap-3 rounded-ctl px-3 text-sm font-medium transition-colors", collapsed && "justify-center px-0",
                      dark
                        ? active ? "bg-rail-active text-white" : "text-rail-fg hover:bg-rail-active/60 hover:text-white"
                        : active ? "bg-accent text-accent-fg shadow-card" : "text-fg/80 hover:bg-bg-subtle")}>
                    {dark && active && <span className="absolute -left-3 top-2.5 h-6 w-1 rounded-r-full bg-accent" />}
                    <it.icon className="size-[19px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{it.label}</span>}
                    {!collapsed && it.badge ? <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tabular", active && !dark ? "bg-white/40" : "bg-accent text-accent-fg")}>{it.badge}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NotificationsSheet({ open, onClose, items }: { open: boolean; onClose: () => void; items: AppNotification[] }) {
  return (
    <Sheet open={open} onClose={onClose} side="auto" title="Notifications" description={`${items.filter((n) => !n.read).length} unread`}>
      <ul className="-mx-5 divide-y divide-line">
        {items.map((n) => (
          <li key={n.id} className={cn("flex gap-3 px-5 py-4", !n.read && "bg-accent-soft/50")}>
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} />
            <div className="min-w-0"><p className="text-sm font-semibold">{n.title}</p><p className="mt-0.5 text-[13px] text-muted">{n.body}</p><p className="mt-1 text-xs text-subtle">{timeAgo(n.at)}</p></div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function AppShell({ cfg, notifications, children }: { cfg: ShellConfig; notifications: AppNotification[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [bell, setBell] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(true);
  const unread = notifications.filter((n) => !n.read).length;
  const dark = cfg.surface === "admin";
  const current = cfg.groups.flatMap((g) => g.items).filter((i) => isActive(cfg.base, pathname, i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const moreActive = !cfg.tabs.some((t) => isActive(cfg.base, pathname, t.href));

  const search = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`${cfg.searchTarget}?q=${encodeURIComponent(q.trim())}`); };

  return (
    <div data-surface={cfg.surface} className="min-h-dvh bg-bg text-fg">
      {/* ---------- Desktop rail ---------- */}
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col border-r transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-64", dark ? "border-black/20 bg-rail" : "border-line bg-card")}>
        <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-0")}>
          <Logo variant={cfg.surface} href={cfg.base} invert={dark} compact={collapsed} />
        </div>
        <div className={cn("flex-1 overflow-y-auto px-3 pb-4 pt-3", collapsed && "px-2")}><NavList cfg={cfg} collapsed={collapsed} /></div>
        <div className={cn("border-t p-3", dark ? "border-white/10" : "border-line")}>
          {cfg.viewSite && !collapsed && (
            <Link href={cfg.viewSite.href} target="_blank" className={cn("mb-2 flex h-10 items-center gap-2.5 rounded-ctl px-3 text-[13px] font-medium", dark ? "text-rail-fg hover:bg-rail-active/60" : "hover:bg-bg-subtle")}><ExternalLink className="size-4" />{cfg.viewSite.label}</Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={cn("flex h-10 w-full items-center gap-2.5 rounded-ctl px-3 text-[13px] font-medium", collapsed && "justify-center px-0", dark ? "text-rail-muted hover:bg-rail-active/60 hover:text-white" : "text-muted hover:bg-bg-subtle")}>
            {collapsed ? <ChevronsRight className="size-4" /> : <><ChevronsLeft className="size-4" /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* ---------- Mobile drawer ---------- */}
      <Sheet open={drawer} onClose={() => setDrawer(false)} side="left" hideHeader className={cn("lg:hidden", dark && "!bg-rail !text-rail-fg")}>
        <div className="-mx-5 flex items-center justify-between px-5 py-4"><Logo variant={cfg.surface} href={cfg.base} invert={dark} /></div>
        <div className="py-2"><NavList cfg={cfg} onNavigate={() => setDrawer(false)} /></div>
        <div className={cn("mt-4 flex items-center gap-3 rounded-card p-3", dark ? "bg-rail-active" : "bg-bg-subtle")}>
          <Avatar name={cfg.user.name} /><div className="min-w-0 flex-1"><p className={cn("truncate text-sm font-semibold", dark && "text-white")}>{cfg.user.name}</p><p className="text-xs opacity-60">{cfg.user.role}</p></div>
          <SignOutButton area={cfg.surface} label="Sign out" className="grid size-9 place-items-center hover:bg-black/10"><LogOut className="size-4" /></SignOutButton>
        </div>
      </Sheet>

      {/* ---------- Main column ---------- */}
      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-card/90 px-3 backdrop-blur-md md:px-6 lg:h-16">
          <IconButton label="Open menu" className="lg:hidden" onClick={() => setDrawer(true)}><Menu className="size-[22px]" /></IconButton>
          <div className="min-w-0 lg:hidden"><p className="truncate text-[15px] font-semibold">{current?.label ?? "Overview"}</p></div>

          <form onSubmit={search} role="search" className="relative ml-2 hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={cfg.searchPlaceholder} aria-label={cfg.searchPlaceholder}
              className="h-10 w-full rounded-full border border-line bg-bg pl-10 pr-4 text-sm placeholder:text-subtle focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </form>

          <div className="ml-auto flex items-center gap-1.5">
            {cfg.storeToggle && (
              <label className="mr-1 hidden items-center gap-2.5 rounded-full border border-line bg-bg px-3 py-1.5 text-[13px] font-medium sm:flex">
                <span className={cn("size-2 rounded-full", open ? "bg-success" : "bg-subtle")} />{open ? "Store open" : "Store paused"}
                <Switch label="Store open" checked={open} onChange={(v) => { setOpen(v); toast.info(v ? "Your store is live again" : "Store paused — buyers can’t place new orders"); }} />
              </label>
            )}
            <IconButton label="Search" className="md:hidden" onClick={() => router.push(cfg.searchTarget)}><Search className="size-5" /></IconButton>
            <IconButton label={`Notifications${unread ? `, ${unread} unread` : ""}`} onClick={() => { setBell(true); void markNotificationsRead(); }} className="relative">
              <Bell className="size-5" />{unread > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-accent ring-2 ring-card" />}
            </IconButton>
            <details className="group relative">
              <summary className="flex cursor-pointer items-center gap-2 rounded-full p-1 pr-1 hover:bg-bg-subtle lg:pr-3"><Avatar name={cfg.user.name} size={34} /><span className="hidden text-left leading-tight lg:block"><span className="block text-[13px] font-semibold">{cfg.user.name}</span><span className="block text-[11px] text-muted">{cfg.user.role}</span></span></summary>
              <div className="animate-pop-in absolute right-0 top-full z-40 mt-2 w-56 rounded-card border border-line bg-panel p-1.5 shadow-pop">
                <Link href={`${cfg.base}/${cfg.surface === "admin" ? "settings" : "profile"}`} className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm hover:bg-bg-subtle"><Settings className="size-4" /> {cfg.surface === "admin" ? "Settings" : "Store profile"}</Link>
                <SignOutButton area={cfg.surface} className="flex h-10 w-full items-center gap-2.5 px-3 text-sm text-danger hover:bg-danger-bg"><LogOut className="size-4" /> Sign out</SignOutButton>
              </div>
            </details>
          </div>
        </header>

        <main id="main" className="container-app pb-[calc(var(--tabbar-h)+1.5rem+env(safe-area-inset-bottom))] pt-5 md:pt-7 lg:pb-12">{children}</main>
      </div>

      {/* ---------- Mobile bottom tabs ---------- */}
      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-safe backdrop-blur-md lg:hidden">
        <ul className="grid h-[var(--tabbar-h)] grid-cols-5">
          {cfg.tabs.map((t) => {
            const active = isActive(cfg.base, pathname, t.href);
            return (
              <li key={t.href}><Link href={t.href} aria-current={active ? "page" : undefined} className={cn("relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-fg" : "text-subtle")}>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
                <span className="relative"><t.icon className="size-[22px]" strokeWidth={active ? 2.3 : 1.8} />{t.badge ? <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold leading-4 text-accent-fg">{t.badge}</span> : null}</span>{t.label}
              </Link></li>
            );
          })}
          <li><button onClick={() => setDrawer(true)} className={cn("flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium", moreActive ? "text-fg" : "text-subtle")}><MoreHorizontal className="size-[22px]" />More</button></li>
        </ul>
      </nav>

      {cfg.fab && (
        <Link href={cfg.fab.href} aria-label={cfg.fab.label} className="fixed bottom-[calc(var(--tabbar-h)+14px+env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-sm font-semibold text-primary-fg shadow-pop active:scale-95 lg:hidden">
          <span className="grid size-7 place-items-center rounded-full bg-accent text-accent-fg"><Plus className="size-4" strokeWidth={3} /></span>{cfg.fab.label}
        </Link>
      )}

      <NotificationsSheet open={bell} onClose={() => setBell(false)} items={notifications} />
      <Toaster />
    </div>
  );
}
