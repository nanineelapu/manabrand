import { AREA } from "@/lib/locale";
import { siteUrl } from "@/lib/supabase/env";
import type { Product } from "@/types";

/** The Google / Facebook card that tells people what ManaBrand is, and how to contact it. One per site. */
export function organizationJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "ManaBrand",
    legalName: "ManaBrand Pvt. Ltd.",
    url,
    logo: `${url}/logo.png`,
    description: "Local fashion for Ichapuram — men's, women's and ethnic wear from trusted sellers.",
    areaServed: { "@type": "City", name: AREA.town, address: { "@type": "PostalAddress", addressLocality: AREA.town, addressRegion: AREA.state, postalCode: AREA.pincode, addressCountry: "IN" } },
    address: { "@type": "PostalAddress", addressLocality: AREA.town, addressRegion: AREA.state, postalCode: AREA.pincode, addressCountry: "IN" },
    contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: "care@manabrand.co.in", telephone: "+91 831 765 8309", areaServed: "IN", availableLanguage: ["en", "te", "hi"] },
    sameAs: [],   // add Instagram / Facebook / YouTube URLs once the client has them
  } as const;
}

/** Tells Google the site's own search box can be used right from the result page (the "sitelinks search box"). */
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

/** A single product in Google's shopping-ready format (price, rating, availability). */
export function productJsonLd(p: Product, sellerName: string) {
  const url = siteUrl();
  const totalStock = Object.values(p.stock ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.seoDescription || p.description,
    sku: p.id,
    brand: { "@type": "Brand", name: sellerName || "ManaBrand" },
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
    },
    ...(p.rating && p.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(p.rating.toFixed(1)), reviewCount: p.reviewCount } } : {}),
  } as const;
}

/** The trail of links at the top of a page (Home → Women → Sarees → <product>). */
export function breadcrumbJsonLd(items: Array<{ name: string; path?: string }>) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.path ? { item: `${url}${it.path}` } : {}) })),
  } as const;
}

/** Drops a JSON-LD block into the HTML. Safe because the data is our own, not user content. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
