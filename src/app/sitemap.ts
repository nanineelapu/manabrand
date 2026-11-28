import type { MetadataRoute } from "next";
import { getCategories, getCollections, queryProducts } from "@/lib/data";
import { GROUPS } from "@/lib/fashion";
import { siteUrl } from "@/lib/supabase/env";

/** /sitemap.xml — every public page a search engine should know about. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [cats, cols, prods] = await Promise.all([getCategories(), getCollections(), queryProducts({ pageSize: 1000 })]);
  const at = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "weekly") => ({ url: `${base}${path}`, priority, changeFrequency, lastModified: new Date() });
  return [
    at("/", 1, "daily"), at("/shop", 0.9, "daily"), at("/new", 0.8, "daily"), at("/sale", 0.7, "daily"), at("/collections", 0.7),
    ...GROUPS.map((g) => at(`/${g.id}`, 0.9, "daily")),
    ...cats.map((c) => at(`/category/${c.slug}`, 0.8)),
    ...cols.map((c) => at(`/collections/${c.slug}`, 0.6)),
    ...prods.items.map((p) => ({ url: `${base}/product/${p.slug}`, priority: 0.7, changeFrequency: "weekly" as const, lastModified: new Date(p.createdAt) })),
    ...["about", "contact", "faq", "shipping-returns", "size-guide", "privacy", "terms"].map((s) => at(`/${s}`, 0.4, "monthly")),
    // Local landing pages — real pages for real local search phrases. Kept in sitemap so Google crawls them.
    ...["fashion-stores-ichapuram", "online-clothing-srikakulam", "saree-shop-ichapuram", "mens-shirts-srikakulam", "womens-dresses-ichapuram", "mens-jeans-delivery-srikakulam"]
       .map((s) => at(`/local/${s}`, 0.7, "weekly")),
  ];
}
