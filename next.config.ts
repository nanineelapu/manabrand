import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },   // uploaded product / banner photos
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,   // an optimised photo is reused for 30 days
  },
  // NOTE: `cacheComponents` / `partialPrefetching` (enabled by the scaffold) are
  // intentionally off during the mock-data frontend phase. Re-evaluate them when
  // the Supabase data layer lands (see docs/CHECKLIST.md > Phase 7).
  async headers() {
    return [
      // the service worker must always be re-checked, so a new deploy can update it
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
