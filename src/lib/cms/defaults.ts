import type { CmsHome, CmsNav, CmsSite } from "./types";

/** Used when Sanity isn't connected, or for any field an editor hasn't filled in. This is the site exactly as designed. */
export const DEFAULT_SITE: CmsSite = {
  siteName: "ManaBrand",
  defaultTitle: "ManaBrand — Shop fashion, electronics, home & more",
  titleTemplate: "%s · ManaBrand",
  description: "A marketplace for fashion, electronics, home, beauty and gourmet from verified Indian sellers. Free shipping above ₹1,499 and delivery within 48 hours.",
  announcementEnabled: true,
  announcements: [
    { text: "Free shipping above ₹1,499" },
    { text: "Delivery within 48 hours" },
    { text: "Use WELCOME10 for 10% off", highlight: "WELCOME10", hideOnMobile: true },
  ],
  footerAbout: "One marketplace for fashion, electronics, home, beauty and more — from verified sellers across India.",
  newsletterTitle: "Get 10% off your first order",
  copyright: "© 2026 ManaBrand Pvt. Ltd. All rights reserved.",
  madeIn: "Made in India",
  supportPhone: "1800-120-6262",
};

export const DEFAULT_NAV: CmsNav = {
  headerLinks: null,
  accountLabel: "Account",
  footerColumns: [
    { title: "Shop", links: [{ label: "Fashion", href: "/category/fashion" }, { label: "Home", href: "/category/home" }, { label: "Sale", href: "/sale" }] },
    { title: "Help", links: [{ label: "Track order", href: "/track-order" }, { label: "Shipping & delivery", href: "/shipping-returns" }, { label: "Size guide", href: "/size-guide" }, { label: "FAQs", href: "/faq" }, { label: "Contact us", href: "/contact" }] },
    { title: "ManaBrand", links: [{ label: "Our story", href: "/about" }, { label: "Sell on ManaBrand", href: "/seller/register" }, { label: "Privacy policy", href: "/privacy" }, { label: "Terms of use", href: "/terms" }] },
  ],
  mobileQuickLinks: [
    { label: "Track order", href: "/track-order" }, { label: "Help & FAQs", href: "/faq" }, { label: "Size guide", href: "/size-guide" }, { label: "Contact us", href: "/contact" },
  ],
};

export const DEFAULT_HOME: CmsHome = {
  slides: [
    {
      headline: "Everything You Need,\nAll in One Place.", headlineEmphasis: "All in One Place.",
      subtitle: "Discover the best of Ichapuram with ManaBrand. Explore a wide range of products from local shops and trusted sellers, all in one convenient marketplace.",
      subtitleHighlight: "best of Ichapuram",
    },
    {
      headline: "Bringing Local Businesses\nCloser to You.", headlineEmphasis: "Local Businesses", category: "gourmet",
      subtitle: "Discover unique products, explore local favourites, and support the businesses that make Ichapuram special. Your community, your marketplace.",
      subtitleHighlight: "Your community, your marketplace.",
    },
    {
      headline: "Style That\nFeels Like You", headlineEmphasis: "You", category: "fashion",
      subtitle: "Handloom, ethnic and everyday fashion from trusted makers, delivered within 48 hours.",
      subtitleHighlight: "delivered within 48 hours",
    },
  ],
  primaryCta: { label: "Shop now", href: "/shop" },
  secondaryCta: { label: "Categories", href: "/#categories" },
  categoriesCardTitle: "Popular categories",
  categoriesTitle: "Shop by category",
  trendingTitle: "Trending now",
  newArrivalsTitle: "New arrivals",
  sellersTitle: "Top sellers",
  sellersSubtitle: "Verified, rated and reviewed by shoppers",
};
