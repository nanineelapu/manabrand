"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Download, Heart, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useBagCount, useStoreData } from "@/components/store/store-data";
import { priceCart } from "@/lib/cart";
import { InstallSteps, useInstallApp } from "@/components/store/install-app";
import { useCart, useWishlist } from "@/lib/stores";
import { useMounted } from "@/lib/stores/hydrate";
import { cn, formatINR } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/shop", label: "Shop", icon: LayoutGrid, match: (p: string) => /^\/(shop|category|collections|new|sale|search)/.test(p) },
  { href: "/wishlist", label: "Wishlist", icon: Heart, match: (p: string) => p.startsWith("/wishlist") },
  { href: "/cart", label: "Bag", icon: ShoppingBag, match: (p: string) => p.startsWith("/cart") },
  { href: "/account", label: "Account", icon: User, match: (p: string) => p.startsWith("/account") },
];

/** Routes with their own sticky action bar hide the tab bar so CTAs never stack. */
const hideOn = [/^\/product\//, /^\/checkout/, /^\/cart/, /^\/order-confirmed/];

/**
 * Phone navigation: a floating bar of red frosted glass (iOS-style). A lighter glass pill slides under the
 * section you are in; everything else is white on the red glass. Hidden from lg up (the header has the menu).
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const mounted = useMounted();
  const lines = useCart((s) => s.lines);
  const bag = useBagCount();
  const { byId, coupons } = useStoreData();
  const wish = useWishlist((s) => s.ids.length);
  const app = useInstallApp();
  const [help, setHelp] = useState(false);
  // The 4th slot is "Install" only when the browser can really install the app (or on iPhone, where the Share-sheet steps
  // are the one honest path). Everywhere else it is the Bag, so taps never lead to an instruction wall.
  const showInstall = mounted && app.available;
  if (hideOn.some((r) => r.test(pathname))) return null;
  const current = tabs.findIndex((t) => t.match(pathname));

  const subtotal = bag > 0 ? priceCart(lines, byId, coupons, null).subtotal : 0;

  return (
    <>
    {/* "bag" indicator above the tab bar — compact white capsule theme */}
    {mounted && bag > 0 && (
      <Link key={bag} href="/cart" aria-label={`View bag, ${bag} ${bag === 1 ? "item" : "items"}, ${formatINR(subtotal)}`} data-round
        className=" fixed bottom-[calc(max(0.35rem,env(safe-area-inset-bottom))+4.2rem)] left-3 right-3 z-40 mx-auto flex max-w-[340px] items-center gap-2.5 rounded-full border border-black/10 bg-white/95 py-2 pl-2 pr-4 text-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:right-16 sm:max-w-sm lg:hidden">
        <span className="relative grid size-8.5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <ShoppingBag className="size-4.5" />
          <span className="absolute -right-1 -top-1 grid min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[9px] font-bold leading-[16px] text-white tabular">{bag}</span>
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[13px] font-bold text-neutral-900">{bag} {bag === 1 ? "item" : "items"} in your bag</span>
          <span className="block text-[11px] font-medium text-neutral-500 tabular">{formatINR(subtotal)}</span>
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-accent">View bag <ChevronRight className="size-3.5" /></span>
      </Link>
    )}
    <nav aria-label="Main" data-round className="fixed inset-x-3 bottom-[max(0.35rem,env(safe-area-inset-bottom))] z-40 lg:hidden">
      <ul className="relative mx-auto grid h-[60px] max-w-md grid-cols-5 rounded-[32px] border border-white/70 bg-white/60 p-1 backdrop-blur-3xl backdrop-saturate-[2] [box-shadow:inset_0_1px_0_rgb(255_255_255/0.9),inset_0_-1px_0_rgb(255_255_255/0.25),0_0_0_0.5px_rgb(0_0_0/0.08)]">
        {/* the sliding glass pill behind the active tab */}
        <span aria-hidden
          className={cn(" pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/5)] rounded-[26px] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.3,1.25,0.5,1)]", current < 0 && "opacity-0")}
          style={{ transform: `translateX(${Math.max(current, 0) * 100}%)` }} />
        {tabs.map(({ href, label, icon: Icon, match }) => {
          if (label === "Bag" && showInstall) {
            return (
              <li key="install" className="relative">
                <button type="button" aria-label="Install the ManaBrand app" onClick={() => (app.canPrompt ? app.install() : app.needsIOSSteps ? setHelp(true) : null)}
                  className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-[26px] text-[11px] font-semibold tracking-tight text-black/70 transition-colors active:scale-95">
                  <Download className="size-[22px]" strokeWidth={1.9} />
                  Install
                </button>
              </li>
            );
          }
          const active = match(pathname);
          const n = label === "Bag" ? bag : label === "Wishlist" ? wish : 0;
          return (
            <li key={href} className="relative">
              <Link href={href} aria-current={active ? "page" : undefined}
                className={cn("flex h-full flex-col items-center justify-center gap-0.5 rounded-[26px] text-[11px] font-semibold tracking-tight transition-colors active:scale-95", active ? "text-black" : "text-black/70")}>
                <span className="relative">
                  <Icon className={cn("size-[22px] transition-transform duration-300", active && "scale-110")} strokeWidth={active ? 2.3 : 1.9} fill={active && label === "Home" ? "currentColor" : "none"} fillOpacity={0.2} />
                  {mounted && n > 0 && <span className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-[rgb(200_16_46)] px-1 text-[9px] font-bold leading-4 text-white tabular">{n}</span>}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    {help && <InstallSteps onClose={() => setHelp(false)} />}
    </>
  );
}
