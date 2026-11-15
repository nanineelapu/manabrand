import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  // NOTE: `cacheComponents` / `partialPrefetching` (enabled by the scaffold) are
  // intentionally off during the mock-data frontend phase. Re-evaluate them when
  // the Supabase data layer lands (see docs/CHECKLIST.md > Phase 7).
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
