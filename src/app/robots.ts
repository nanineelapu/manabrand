import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/supabase/env";

/** /robots.txt — keep private areas (admin, seller, accounts, checkout) out of search results. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/seller", "/account", "/cart", "/checkout", "/order-confirmed", "/print", "/studio", "/api"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
