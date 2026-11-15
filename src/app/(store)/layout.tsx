import { getNavContent, getSiteContent, resolveHeader } from "@/lib/cms";
import { Preloader } from "@/components/store/preloader";
import { CtaBand } from "@/components/store/cta-band";
import { SmoothScroll } from "@/components/store/smooth-scroll";
import { Footer } from "@/components/store/footer";
import { MobileMenu, StoreHeader } from "@/components/store/header";
import { MiniCart } from "@/components/store/mini-cart";
import { SearchOverlay } from "@/components/store/search-overlay";
import { StoreDataProvider, type CouponLite, type ProductLite } from "@/components/store/store-data";
import { MobileTabBar } from "@/components/store/tab-bar";
import { ShopperSync } from "@/components/store/shopper-sync";
import { getSessionProfile } from "@/lib/auth/session";
import { Toaster } from "@/components/ui/toaster";
import { getAllCoupons, getCategories, getSubcategories, getTrendingSearches, queryProducts, getSellerNames } from "@/lib/data";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [categories, trending, coupons, all, sellerNames] = await Promise.all([
    getCategories(), getTrendingSearches(), getAllCoupons(), queryProducts({ pageSize: 500 }), getSellerNames(),
  ]);
  const session = await getSessionProfile();
  const [site, navContent] = await Promise.all([getSiteContent(), getNavContent()]);
  const subs = Object.fromEntries(await Promise.all(categories.map(async (c) => [c.slug, await getSubcategories(c.slug)] as const)));
  const headerItems = resolveHeader(navContent, categories, subs);
  const lite: ProductLite[] = all.items.map((p) => ({
    image: p.images[0], id: p.id, slug: p.slug, name: p.name, price: p.price, mrp: p.mrp, photo: p.photo, colors: p.colors, optionLabel: p.optionLabel, sizes: p.sizes, stock: p.stock,
    sellerName: sellerNames[p.sellerId] ?? "", category: p.categorySlug, sub: p.subcategory, rating: p.rating,
  }));
  const couponLite: CouponLite[] = coupons.filter((c) => c.status === "active").map(({ code, description, type, value, minOrder, maxDiscount }) => ({ code, description, type, value, minOrder, maxDiscount }));

  return (
    <div data-surface="store" className="flex min-h-dvh flex-col overflow-x-clip bg-bg text-fg">
      <StoreDataProvider products={lite} coupons={couponLite}>
        <SmoothScroll />
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
        <Toaster offsetBottom />
      </StoreDataProvider>
    </div>
  );
}
