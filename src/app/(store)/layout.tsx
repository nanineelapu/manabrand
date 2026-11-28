import { getNavContent, getSiteContent, resolveHeader } from "@/lib/cms";
import { Preloader } from "@/components/store/preloader";
import { CtaBand } from "@/components/store/cta-band";
import { InstallBanner, RegisterServiceWorker } from "@/components/store/install-app";
import { Footer } from "@/components/store/footer";
import { RouteProgress } from "@/components/ui/route-progress";
import { MobileMenu, StoreHeader } from "@/components/store/header";
import { MiniCart } from "@/components/store/mini-cart";
import { SearchOverlay } from "@/components/store/search-overlay";
import { StoreDataProvider, type CouponLite } from "@/components/store/store-data";
import { MobileTabBar } from "@/components/store/tab-bar";
import { ShopperSync } from "@/components/store/shopper-sync";
import { CartGuard } from "@/components/store/cart-guard";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { WelcomeWalletPopup } from "@/components/store/welcome-wallet-popup";
import { Toaster } from "@/components/ui/toaster";
import { getPublicCoupons, getCategories, getSubcategoryMap, getTrendingSearches, getStoreProductsLite } from "@/lib/data";

/** Public pages are cached and refreshed in the background every minute; admin edits refresh them at once (see clearDataCache). */
export const revalidate = 60;

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [categories, trending, coupons, subs, lite, [site, navContent]] = await Promise.all([
    getCategories(),
    getTrendingSearches(),
    getPublicCoupons(),
    getSubcategoryMap(),
    getStoreProductsLite(),
    Promise.all([getSiteContent(), getNavContent()]),
  ]);
  const headerItems = resolveHeader(navContent, categories, subs);
  const couponLite: CouponLite[] = coupons
    .filter((c) => c.status === "active")
    .map(({ code, description, type, value, minOrder, maxDiscount }) => ({
      code,
      description,
      type,
      value,
      minOrder,
      maxDiscount,
    }));

  return (
    <div data-surface="store" className="flex min-h-dvh flex-col overflow-x-clip bg-bg text-fg">
      <StoreDataProvider products={lite} coupons={couponLite}>
        <RouteProgress />
        <RegisterServiceWorker />
        <InstallBanner />
        <Preloader />
        <StoreHeader items={headerItems} accountLabel={navContent.accountLabel} />
        <main id="main" className="flex-1">{children}</main>
        <CtaBand site={site} />
        <Footer site={site} nav={navContent} />
        <CartGuard />
        <ShopperSync />
        <MobileTabBar />
        <MobileMenu items={headerItems} quickLinks={navContent.mobileQuickLinks} />
        <SearchOverlay trending={trending} />
        <MiniCart />
        <WhatsAppButton />
        <WelcomeWalletPopup />
        <Toaster offsetBottom />
      </StoreDataProvider>
    </div>
  );
}
