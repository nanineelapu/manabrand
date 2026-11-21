"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Download, Heart, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { InstallSteps, useInstallApp } from "@/components/store/install-app";
import { useCart, useWishlist } from "@/lib/stores";
import { useMounted } from "@/lib/stores/hydrate";
import { cn } from "@/lib/utils";

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
  const bag = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const wish = useWishlist((s) => s.ids.length);
  const app = useInstallApp();
  const [help, setHelp] = useState(false);
  // the 4th slot is "Install" until the app is installed, then it becomes the Bag again (the header always has a Bag button too)
  const showInstall = mounted ? !app.installed : true;
  if (hideOn.some((r) => r.test(pathname))) return null;
  const current = tabs.findIndex((t) => t.match(pathname));

  return (
    <>
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
