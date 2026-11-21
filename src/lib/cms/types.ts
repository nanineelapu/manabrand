import type { PortableTextBlock } from "next-sanity";

export interface CmsLink { label: string; href: string }

export interface CmsSite {
  siteName: string; defaultTitle: string; titleTemplate: string; description: string; ogImage?: string;
  announcementEnabled: boolean;
  announcements: { text: string; highlight?: string; hideOnMobile?: boolean }[];
  footerAbout: string; newsletterTitle: string; copyright: string; madeIn: string;
  supportPhone: string; supportEmail?: string; instagram?: string; youtube?: string;
}

export interface CmsHeaderLink extends CmsLink { accent?: boolean; dropdownCategory?: string; showOn?: "all" | "desktop" | "mobile" }

export interface CmsNav {
  /** null → build the menu automatically from the shop's categories */
  headerLinks: CmsHeaderLink[] | null;
  accountLabel: string;
  footerColumns: { title: string; links: CmsLink[] }[];
  mobileQuickLinks: CmsLink[];
}

/** One hero slide (a "template" the client adds in Sanity → Home page → Hero slides). */
export interface HeroSlide {
  headline: string; headlineEmphasis?: string; subtitle: string; subtitleHighlight?: string;
  /** shorter sub-headline shown on phones (falls back to the full one) */
  subtitleShort?: string;
  /** category slug — the product cards on the slide come from it; empty = trending products */
  category?: string;
  /** optional faint background photo for this slide */
  image?: string;
  /** optional portrait photo used instead of `image` on phones (≤ 767px wide) */
  mobileImage?: string;
}

export interface CmsHome {
  slides: HeroSlide[];
  /** the two buttons that stay fixed on top of the hero carousel */
  primaryCta: CmsLink; secondaryCta: CmsLink;
  categoriesCardTitle: string; categoriesTitle: string;
  trendingTitle: string; newArrivalsTitle: string; sellersTitle: string; sellersSubtitle: string;
}

export interface CmsPage {
  title: string; slug: string; intro?: string; updated?: string;
  body?: PortableTextBlock[]; sideImage?: string;
  stats?: { value: string; label: string }[];
  faqGroups?: { title?: string; items: { question: string; answer: string }[] }[];
  ctas?: { label: string; href: string }[];
  seoTitle?: string; seoDescription?: string;
}

/** What the header & mobile menu render — already merged with the shop's categories. */
export interface HeaderItem {
  label: string; href: string; accent?: boolean; soon?: boolean; showOn: "all" | "desktop" | "mobile";
  /** a mega menu: columns of categories, each with its sub-categories */
  dropdown?: { title: string; href: string; columns: { name: string; href: string; subs: { label: string; href: string }[] }[] };
}
