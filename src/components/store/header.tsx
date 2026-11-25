"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Logo, LogoImage } from "@/components/brand/logo";
import { IconButton } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useCart, useUi, useWishlist } from "@/lib/stores";
import { useMounted } from "@/lib/stores/hydrate";
import { cn } from "@/lib/utils";
import type { CmsLink, HeaderItem } from "@/lib/cms/types";

/** `items` is the menu resolved from the CMS (Navigation) merged with the shop's categories. */
interface Props { items: HeaderItem[]; accountLabel?: string; quickLinks?: CmsLink[] }

const capsule = "flex h-[50px] items-center rounded-full border border-white/10 bg-black/90 backdrop-blur-xl sm:h-13 lg:h-[60px]";

export function StoreHeader({ items, accountLabel = "Account" }: Props) {
  const mounted = useMounted();
  const pathname = usePathname();
  const { setMenu, setSearch } = useUi();
  const bag = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const wish = useWishlist((s) => s.ids.length);

  useEffect(() => {
    document.documentElement.dataset.header = "shown";
  }, []);

  return (
    // data-round: capsule header — fixed sticky at top, no hiding on scroll
    <header data-round data-theme="dark" className="sticky top-0 z-40 px-2.5 pt-2 transition-colors duration-200 md:px-6 lg:pt-3.5">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-3 sm:gap-6 lg:gap-8">
        {/* capsule 1 — brand */}
        <div className={cn(capsule, "shrink-0 px-3 sm:px-4 lg:px-5")}>
          <Link href="/" aria-label="ManaBrand home" className="flex shrink-0 items-center">
            <LogoImage size="md" priority invert className="h-[38px] sm:h-[42px] lg:h-[46px]" />
          </Link>
        </div>

        {/* capsule 2 — menu, search, bag, hamburger */}
        <div className={cn(capsule, "min-w-0 gap-1.5 pl-2 pr-1.5 sm:gap-2 sm:pl-3 sm:pr-2 lg:pl-3.5 lg:pr-2.5")}>
          <nav aria-label="Primary" className="hidden min-w-0 items-center lg:flex">
            {items.filter((it) => it.showOn !== "mobile").map((it) => it.dropdown ? (
              <div key={it.href + it.label} className="group/nav flex items-center self-stretch">
                <NavLink href={it.href} active={pathname === it.href} accent={it.accent} chevron>{it.label}</NavLink>
                <div className="invisible absolute right-0 top-full z-50 w-[920px] max-w-[94vw] pt-3 opacity-0 transition-all duration-150 group-focus-within/nav:visible group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:opacity-100">
                  <div className="rounded-3xl border border-white/10 bg-black/95 p-6 text-white">
                    <div className="mb-4 flex items-baseline justify-between"><p className="text-xs font-medium uppercase tracking-[0.14em] text-white/50">{it.dropdown.title}</p><Link href={it.dropdown.href} className="text-sm font-semibold text-accent">Shop all</Link></div>
                    <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                      {it.dropdown.columns.map((col) => (
                        <div key={col.href}>
                          <Link href={col.href} className="block text-sm font-bold text-white hover:text-accent">{col.name}</Link>
                          <ul className="mt-2">
                            {col.subs.map((sub) => <li key={sub.href}><Link href={sub.href} className="block py-1 text-[13px] text-white/65 hover:text-white">{sub.label}</Link></li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <NavLink key={it.href + it.label} href={it.href} active={pathname === it.href} accent={it.accent}>{it.label}{it.soon && <span className="ml-1.5 rounded-full bg-white/15 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide">Soon</span>}</NavLink>
            ))}
          </nav>

          {/* 1. Search button */}
          <IconButton size="sm" label="Search" className="size-9.5 text-white hover:bg-white/10 sm:size-10" onClick={() => setSearch(true)}><Search className="size-[19px] sm:size-[20px]" /></IconButton>

          <Link href="/wishlist" aria-label={`Wishlist${mounted && wish ? `, ${wish} items` : ""}`} className="relative hidden size-11 place-items-center rounded-full hover:bg-white/10 xl:grid">
            <Heart className="size-[20px]" />{mounted && wish > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-white tabular">{wish > 9 ? "9+" : wish}</span>}
          </Link>
          <Link href="/account" aria-label={accountLabel} title={accountLabel} className="hidden size-11 place-items-center rounded-full hover:bg-white/10 lg:grid"><User className="size-[20px]" /></Link>

          {/* 2. Bag: on mobile "Bag", on desktop "Order now" */}
          <Link href={mounted && bag > 0 ? "/checkout" : "/shop"} prefetch aria-label={`Bag${mounted && bag ? `, ${bag} items in bag` : ""}`}
            className="inline-flex h-9.5 items-center gap-1.5 rounded-full bg-primary px-3 text-[13px] font-bold text-white transition-colors hover:bg-primary-hover sm:h-10 sm:gap-2 sm:px-4 sm:text-[14px] lg:h-11 lg:pl-5 lg:pr-4.5 lg:text-[15px]">
            <span className="lg:hidden">Bag</span>
            <span className="hidden lg:inline">Order now</span>
            <span className="relative grid place-items-center">
              <ShoppingBag className="size-[17px] sm:size-[18px]" />
              {mounted && bag > 0 && <span className="absolute -right-2 -top-2 grid min-w-[16px] place-items-center rounded-full bg-white px-1 text-[10px] font-bold leading-[16px] text-primary tabular sm:min-w-[17px] sm:leading-[17px]">{bag > 9 ? "9+" : bag}</span>}
            </span>
          </Link>

          {/* 3. Hamburger menu: at the very right on mobile */}
          <IconButton size="sm" label="Open menu" className="size-9.5 text-white hover:bg-white/10 sm:size-10 lg:hidden" onClick={() => setMenu(true)}>
            <Menu className="size-[21px] sm:size-[22px]" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children, active, accent, chevron }: { href: string; children: React.ReactNode; active?: boolean; accent?: boolean; chevron?: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={cn("inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[14px] font-semibold tracking-tight transition-colors xl:px-4 xl:text-[15px]",
        accent ? "bg-accent/15 text-accent hover:bg-accent hover:text-white" : active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white")}>
      {children}{chevron && <ChevronDown className="size-3.5 opacity-60 transition-transform duration-200 group-hover/nav:rotate-180 group-focus-within/nav:rotate-180" />}
    </Link>
  );
}

/* ------------------------------------------------------------ Mobile menu */
export function MobileMenu({ items, quickLinks = [] }: Props) {
  const open = useUi((s) => s.menuOpen);
  const setOpen = useUi((s) => s.setMenu);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onClose={close} side="left" hideHeader className="lg:hidden">
      <div className="-mx-5 flex items-center justify-between border-b border-line px-5 py-4">
        <Logo />
        <button onClick={close} className="h-9 rounded-full bg-bg-subtle px-4 text-sm font-medium">Close</button>
      </div>
      <nav className="py-2" aria-label="Menu">
        {items.filter((it) => it.showOn !== "desktop").map((it) => it.dropdown ? (
          <details key={it.href + it.label} className="group border-b border-line">
            <summary className="flex min-h-14 cursor-pointer items-center justify-between text-[15px] font-semibold">
              {it.label}<ChevronDown className="chev size-5 text-muted transition-transform" />
            </summary>
            <ul className="pb-3 pl-1">
              <li><Link onClick={close} href={it.dropdown.href} className="block py-2.5 text-sm font-semibold text-accent">Shop all {it.dropdown.title}</Link></li>
              {it.dropdown.columns.map((col) => (
                <li key={col.href}><Link onClick={close} href={col.href} className="block py-2.5 text-sm text-muted">{col.name}</Link></li>
              ))}
            </ul>
          </details>
        ) : <MenuRow key={it.href + it.label} href={it.href} onClick={close} accent={it.accent}>{it.label}{it.soon && <span className="ml-1.5 rounded-full bg-black/10 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide">Soon</span>}</MenuRow>)}
      </nav>
      <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
        {quickLinks.map((q) => (
          <Link key={q.href + q.label} href={q.href} onClick={close} className="rounded-2xl bg-black px-4 py-3.5 font-semibold text-white transition-colors hover:bg-primary">{q.label}</Link>
        ))}
      </div>
      <Link href="/seller/register" onClick={close} className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-accent-soft p-4 text-fg">
        <span><span className="block text-sm font-semibold">Sell on ManaBrand</span><span className="text-xs text-muted">Open your store in minutes</span></span>
        <span aria-hidden className="text-accent">→</span>
      </Link>
    </Sheet>
  );
}

function MenuRow({ href, children, onClick, accent }: { href: string; children: React.ReactNode; onClick: () => void; accent?: boolean }) {
  return <Link href={href} onClick={onClick} className={cn("flex min-h-14 items-center border-b border-line text-[15px] font-semibold", accent && "text-accent")}>{children}</Link>;
}
