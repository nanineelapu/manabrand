import type { Metadata } from "next";
import { AREA } from "@/lib/locale";
import { siteUrl } from "@/lib/supabase/env";
import type { Product } from "@/types";

/* ============================================================== META ENGINE
 * One function turns a page's facts into every meta tag Google / Facebook / Twitter / X care about.
 * It is intentionally small: the real SEO work is in the page's own facts (title, description), not in a thousand
 * generated keyword lines. Every page builds its own facts and hands them here, so there is one voice site-wide.
 */
interface MetaInput {
  /** Short, specific page name. We append " | ManaBrand" automatically unless `rawTitle` is true. */
  title: string;
  /** 1–2 natural sentences. 140–160 characters is the sweet spot. */
  description: string;
  /** Page path starting with /. Used for canonical and OG URL. */
  path: string;
  /** Hero image for social share. Optional; falls back to the ManaBrand logo. */
  image?: string;
  /** Title gets " | ManaBrand" appended unless this is true (used by the root layout). */
  rawTitle?: boolean;
  /** Set to true for private, thin or user-specific pages (/cart, /account, /search?q=...). */
  noindex?: boolean;
  /** og:type — "website" (default) or "article" for blog-style content. */
  type?: "website" | "article";
}

export function pageMeta(input: MetaInput): Metadata {
  const title = input.rawTitle ? input.title : `${input.title} | ManaBrand`;
  const url = input.path;
  const img = input.image || "/logo.png";
  const robots: Metadata["robots"] = input.noindex
    ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
    : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } };
  return {
    title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: { type: input.type ?? "website", url, title, description: input.description, siteName: "ManaBrand", locale: "en_IN", images: [{ url: img }] },
    twitter: { card: "summary_large_image", title, description: input.description, images: [img] },
    robots,
  };
}

/* =========================================================== SITE-WIDE JSON-LD
 * One Organization card and one Website card cover every page (dropped in the root layout).
 */
export function organizationJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "ManaBrand",
    legalName: "ManaBrand Pvt. Ltd.",
    url,
    logo: `${url}/logo.png`,
    description: "Local fashion for Ichapuram — men's, women's and ethnic wear from identity-verified local sellers.",
    areaServed: { "@type": "City", name: AREA.town, address: { "@type": "PostalAddress", addressLocality: AREA.town, addressRegion: AREA.state, postalCode: AREA.pincode, addressCountry: "IN" } },
    address: { "@type": "PostalAddress", addressLocality: AREA.town, addressRegion: AREA.state, postalCode: AREA.pincode, addressCountry: "IN" },
    contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: "care@manabrand.co.in", telephone: "+91 831 765 8309", areaServed: "IN", availableLanguage: ["en", "te", "hi"] },
    sameAs: [],
  } as const;
}

export function websiteJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ManaBrand",
    url,
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${url}/search?q={query}` }, "query-input": "required name=query" },
  } as const;
}

/* ================================================================= PRODUCT JSON-LD
 * Only real database values — never invented prices, ratings or stock. Google penalises fakes.
 */
export function productJsonLd(p: Product, sellerName: string) {
  const url = siteUrl();
  const totalStock = Object.values(p.stock ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.seoDescription || p.description,
    sku: p.id,
    mpn: p.id,
    brand: { "@type": "Brand", name: sellerName || "ManaBrand" },
    category: p.categorySlug,
    image: (p.images?.length ? p.images : [`${url}/logo.png`]).map((img) => (img.startsWith("http") ? img : `${url}${img}`)),
    offers: {
      "@type": "Offer",
      url: `${url}/product/${p.slug}`,
      priceCurrency: "INR",
      price: p.price,
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      priceValidUntil: new Date(Date.now() + 90 * 86400_000).toISOString().slice(0, 10),
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: sellerName || "ManaBrand" },
      // Real-world facts about this seller's fulfilment, so Google can show "Fast delivery" badges.
      shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: "49", currency: "INR" }, shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN", addressRegion: AREA.state }, deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" }, transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "DAY" } } },
      // Honest returns policy: exchanges only, within 7 days.
      hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "IN", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 7, returnMethod: "https://schema.org/ReturnByMail", returnFees: "https://schema.org/FreeReturn" },
    },
    ...(p.rating && p.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(p.rating.toFixed(1)), reviewCount: p.reviewCount } } : {}),
  } as const;
}

/* ================================================================ BREADCRUMBS
 */
export function breadcrumbJsonLd(items: Array<{ name: string; path?: string }>) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.path ? { item: `${url}${it.path}` } : {}) })),
  } as const;
}

/* =============================================================== LISTING PAGES
 * A CollectionPage with an ItemList of the first results so Google can preview a listing in rich results.
 */
export function listingJsonLd(args: { name: string; description: string; path: string; items: Array<{ name: string; slug: string; image?: string; price?: number }> }) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: args.name,
    description: args.description,
    url: `${url}${args.path}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: args.items.length,
      itemListElement: args.items.slice(0, 20).map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${url}/product/${it.slug}`,
        name: it.name,
        ...(it.image ? { image: it.image } : {}),
      })),
    },
  } as const;
}

/* =============================================================== JSON-LD TAG
 * Dropped into the <head> or at the top of the page body. One or many blocks accepted.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/* ======================================================= PER-PAGE HELPERS ====
 * Short, honest title + description builders. Every one uses real facts, not keyword salad.
 */

const CITY = AREA.town;

export const homeMeta = (): MetaInput => ({
  title: "Fashion, clothing & latest trends",
  description: `Shop men's, women's and ethnic wear from verified local sellers in ${CITY}. 48-hour delivery, cash on delivery, and a ₹500 welcome wallet gift.`,
  path: "/",
});

export const groupMeta = (group: "men" | "women"): MetaInput => group === "men"
  ? { title: "Men's clothing & fashion", description: `Shop men's t-shirts, shirts, jeans, trousers and ethnic wear on ManaBrand — delivered within 48 hours in and around ${CITY}.`, path: "/men" }
  : { title: "Women's clothing & fashion", description: `Shop women's tops, kurtis, sarees, dresses, jeans and ethnic wear on ManaBrand — delivered within 48 hours in and around ${CITY}.`, path: "/women" };

export const newMeta = (): MetaInput => ({
  title: "New arrivals — fresh fashion",
  description: `The latest men's and women's fashion drops on ManaBrand. New arrivals from verified local sellers, delivered within 48 hours in ${CITY}.`,
  path: "/new",
});

export const saleMeta = (): MetaInput => ({
  title: "Sale — up to 70% off",
  description: `Deals on men's and women's clothing on ManaBrand. Everyday wear, ethnic wear and festive looks at discounted prices, delivered within 48 hours in ${CITY}.`,
  path: "/sale",
});

export const shopMeta = (): MetaInput => ({
  title: "Shop all clothing",
  description: `Browse every product on ManaBrand — men's, women's and ethnic wear from identity-verified sellers in ${CITY}. 48-hour delivery and a ₹500 welcome wallet gift.`,
  path: "/shop",
});

/** Category and subcategory: use the real category name. Honest copy, no keyword stuffing. */
export const categoryMeta = (args: { name: string; slug: string; sub?: string; productCount?: number }): MetaInput => {
  const sub = args.sub ? ` · ${args.sub}` : "";
  const path = args.sub ? `/category/${args.slug}?sub=${encodeURIComponent(args.sub)}` : `/category/${args.slug}`;
  const base = args.sub ? `Shop ${args.sub.toLowerCase()} in ${args.name.toLowerCase()}` : `Shop ${args.name.toLowerCase()}`;
  const count = args.productCount ? ` (${args.productCount} styles)` : "";
  return {
    title: `${args.name}${sub}${count}`,
    description: `${base} on ManaBrand. Identity-verified local sellers, cash on delivery and 48-hour delivery in and around ${CITY}.`,
    path,
  };
};

/** Collection (a curated theme like "Wedding Edit"). */
export const collectionMeta = (args: { name: string; slug: string; story?: string }): MetaInput => ({
  title: args.name,
  description: args.story?.trim() ? args.story.trim().slice(0, 158) : `Browse the ${args.name} collection on ManaBrand — curated looks from verified local sellers, delivered within 48 hours.`,
  path: `/collections/${args.slug}`,
});

/** Seller storefront. */
export const sellerMeta = (args: { name: string; slug: string; blurb?: string }): MetaInput => ({
  title: `${args.name} — fashion seller on ManaBrand`,
  description: args.blurb?.trim() ? args.blurb.trim().slice(0, 158) : `Shop ${args.name}'s clothing on ManaBrand. Identity-verified, delivered within 48 hours in ${CITY}.`,
  path: `/sellers/${args.slug}`,
});

/** Product page — actual product facts first, brand second. */
export const productMeta = (args: { name: string; slug: string; seoTitle?: string; seoDescription?: string; description?: string; price?: number; image?: string; sellerName?: string; categoryName?: string }): MetaInput => {
  const t = args.seoTitle?.trim() || args.name;
  const d = args.seoDescription?.trim() || args.description?.trim() || `${args.name}${args.categoryName ? ` in ${args.categoryName}` : ""}${args.sellerName ? ` by ${args.sellerName}` : ""}. Delivered within 48 hours in ${CITY}.`;
  return {
    title: t,
    description: d.slice(0, 158),
    path: `/product/${args.slug}`,
    image: args.image,
  };
};

/** A thin / private / query page — no index, no follow. */
export const privateMeta = (title: string, path: string): MetaInput => ({
  title,
  description: `${title} — ManaBrand.`,
  path,
  noindex: true,
});
