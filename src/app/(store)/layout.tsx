import { getNavContent, getSiteContent, resolveHeader } from "@/lib/cms";
import { Preloader } from "@/components/store/preloader";
import { CtaBand } from "@/components/store/cta-band";
import { InstallBanner, RegisterServiceWorker } from "@/components/store/install-app";
import { SmoothScroll } from "@/components/store/smooth-scroll";
import { Footer } from "@/components/store/footer";
import { MobileMenu, StoreHeader } from "@/components/store/header";
import { MiniCart } from "@/components/store/mini-cart";
import { SearchOverlay } from "@/components/store/search-overlay";
import { StoreDataProvider, type CouponLite } from "@/components/store/store-data";
import { MobileTabBar } from "@/components/store/tab-bar";
import { ShopperSync } from "@/components/store/shopper-sync";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { getSessionProfile } from "@/lib/auth/session";
import { Toaster } from "@/components/ui/toaster";
import { getAllCoupons, getCategories, getSubcategoryMap, getTrendingSearches, getStoreProductsLite } from "@/lib/data";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [categories, trending, coupons, subs, lite, session, [site, navContent]] = await Promise.all([
    getCategories(),
    getTrendingSearches(),
    getAllCoupons(),
    getSubcategoryMap(),
    getStoreProductsLite(),
    getSessionProfile(),
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
        <SmoothScroll />
        <RegisterServiceWorker />
        <InstallBanner />
        <Preloader />
        <StoreHeader items={headerItems} accountLabel={navContent.accountLabel} />
        <main id="main" className="flex-1">{children}</main>
        <CtaBand site={site} />
        <Footer site={site} nav={navContent} />
        <ShopperSync signedIn={session?.role === "customer"} />
        <MobileTabBar />
        <MobileMenu items={headerItems} quickLinks={navContent.mobileQuickLinks} />
        <SearchOverlay trending={trending} />
        <MiniCart />
        <WhatsAppButton />
        <Toaster offsetBottom />
      </StoreDataProvider>
    </div>
  );
}
