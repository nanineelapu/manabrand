"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Download, Heart, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useStoreData } from "@/components/store/store-data";
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
  const bag = lines.reduce((a, l) => a + l.qty, 0);
  const { byId, coupons } = useStoreData();
  const wish = useWishlist((s) => s.ids.length);
  const app = useInstallApp();
  const [help, setHelp] = useState(false);
  // the 4th slot is "Install" until the app is installed, then it becomes the Bag again (the header always has a Bag button too)
  const showInstall = mounted ? !app.installed : true;
  if (hideOn.some((r) => r.test(pathname))) return null;
  const current = tabs.findIndex((t) => t.match(pathname));

  const subtotal = bag > 0 ? priceCart(lines, byId, coupons, null).subtotal : 0;

  return (
    <>
    {/* "bag" indicator above the tab bar — appears as soon as something is added (like other shops' sticky cart) */}
    {mounted && bag > 0 && (
      <Link key={bag} href="/cart" aria-label={`View bag, ${bag} ${bag === 1 ? "item" : "items"}, ${formatINR(subtotal)}`} data-round
        className="animate-pop-in fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] left-3 right-[4.75rem] z-40 mx-auto flex max-w-sm items-center gap-3 rounded-full bg-black py-2 pl-2 pr-3.5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] lg:hidden">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-white/15"><ShoppingBag className="size-[18px]" /><span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-[#e0247a] px-1 text-[10px] font-bold leading-[18px] tabular">{bag}</span></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-bold">{bag} {bag === 1 ? "item" : "items"} in your bag</span><span className="block text-xs text-white/65 tabular">{formatINR(subtotal)}</span></span>
        <span className="inline-flex items-center gap-0.5 text-[13px] font-bold text-[#ff7ab8]">View bag <ChevronRight className="size-4" /></span>
      </Link>
    )}
    <nav aria-label="Main" data-round className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden">
      <ul className="relative mx-auto grid h-16 max-w-md grid-cols-5 rounded-[30px] border border-white/70 bg-white/40 p-1.5 backdrop-blur-3xl backdrop-saturate-[2] [box-shadow:inset_0_1px_0_rgb(255_255_255/0.9),inset_0_-1px_0_rgb(255_255_255/0.25),0_0_0_0.5px_rgb(0_0_0/0.08)]">
        {/* the sliding glass pill behind the active tab */}
        <span aria-hidden
          className={cn("tab-pill pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 w-[calc((100%-0.75rem)/5)] rounded-[24px] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.3,1.25,0.5,1)]", current < 0 && "opacity-0")}
          style={{ transform: `translateX(${Math.max(current, 0) * 100}%)` }} />
        {tabs.map(({ href, label, icon: Icon, match }) => {
          if (label === "Bag" && showInstall) {
            return (
              <li key="install" className="relative">
                <button type="button" aria-label="Install the ManaBrand app" onClick={() => (app.canPrompt ? app.install() : setHelp(true))}
                  className="flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-[24px] text-[10.5px] font-semibold tracking-tight text-black/70 transition-colors active:scale-95">
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
                className={cn("flex h-full flex-col items-center justify-center gap-0.5 rounded-[24px] text-[10.5px] font-semibold tracking-tight transition-colors active:scale-95", active ? "text-black" : "text-black/70")}>
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
