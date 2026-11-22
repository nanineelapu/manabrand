/**
 * Sanity powers the *site content* (navigation, announcement bar, footer, home-page copy, titles/SEO, info pages).
 * Products, orders, categories, banners and coupons stay in Supabase — admins keep managing those in /admin.
 * Without a project id the site simply uses the built-in content (src/lib/cms/defaults.ts).
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-02-19";
export const isSanityConfigured = () => /^[a-z0-9]+$/.test(projectId);
