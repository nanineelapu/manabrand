import type { CmsHome, CmsNav, CmsSite } from "./types";

/** Used when Sanity isn't connected, or for any field an editor hasn't filled in. This is the site exactly as designed. */
export const DEFAULT_SITE: CmsSite = {
  siteName: "ManaBrand",
  defaultTitle: "ManaBrand — Fashion from local makers",
  titleTemplate: "%s · ManaBrand",
  description: "A local fashion marketplace for men's and women's clothing from verified sellers in Ichapuram. Footwear coming soon. Delivery within 48 hours.",
  announcementEnabled: true,
  announcements: [
    { text: "Delivery within 48 hours" },
    { text: "Use WELCOME10 for 10% off", highlight: "WELCOME10", hideOnMobile: true },
  ],
  footerAbout: "A local fashion marketplace for men and women — from verified sellers in Ichapuram.",
  newsletterTitle: "Get 10% off your first order",
  copyright: "© 2026 ManaBrand Pvt. Ltd. All rights reserved.",
  madeIn: "Made in Ichapuram",
  supportPhone: "+91 831 765 8309",
};

export const DEFAULT_NAV: CmsNav = {
  headerLinks: null,
  accountLabel: "Account",
  footerColumns: [
    { title: "Shop", links: [{ label: "Men", href: "/men" }, { label: "Women", href: "/women" }, { label: "Footwear (soon)", href: "/category/footwear" }, { label: "New arrivals", href: "/new" }, { label: "Sale", href: "/sale" }] },
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
      headline: "Fashion for Everyone,\nAll in One Place.", headlineEmphasis: "All in One Place.",
      subtitle: "Discover the best of Ichapuram fashion with ManaBrand — trusted local shops, all in one marketplace.",
      subtitleShort: "The best of Ichapuram fashion, at your door.",
      subtitleHighlight: "Ichapuram fashion",
    },
    {
      headline: "Bringing Local Fashion\nCloser to You.", headlineEmphasis: "Local Fashion", category: "men",
      subtitle: "Discover unique pieces from local makers and support the shops that make Ichapuram special. Your community, your marketplace.",
      subtitleShort: "Support local. Wear local.",
      subtitleHighlight: "Wear local.",
    },
    {
      headline: "Style That\nFeels Like You", headlineEmphasis: "You", category: "women",
      subtitle: "Handloom, ethnic and everyday fashion from trusted makers, delivered within 48 hours.",
      subtitleShort: "Everyday fashion, delivered within 48 hours.",
      subtitleHighlight: "delivered within 48 hours",
    },
  ],
  primaryCta: { label: "Shop now", href: "/shop" },
  secondaryCta: { label: "Categories", href: "/#categories" },
  categoriesCardTitle: "Popular categories",
  categoriesTitle: "Shop by category",
  trendingTitle: "Trending now",
  newArrivalsTitle: "New arrivals",
  sellersTitle: "Local sellers",
  sellersSubtitle: "Shops from right here in Ichapuram — verified, and rated by your neighbours.",
};
