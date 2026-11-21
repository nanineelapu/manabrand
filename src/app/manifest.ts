import type { MetadataRoute } from "next";

/** Web app manifest: lets people install ManaBrand ("Add to Home screen") and open it like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ManaBrand",
    short_name: "ManaBrand",
    description: "Shop local fashion — men's, women's and ethnic wear from trusted sellers in Ichapuram.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["shopping"],
    lang: "en-IN",
    icons: [
      { src: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "Shop", url: "/shop", icons: [{ src: "/favicon/android-chrome-192x192.png", sizes: "192x192" }] },
      { name: "My orders", url: "/account/orders", icons: [{ src: "/favicon/android-chrome-192x192.png", sizes: "192x192" }] },
    ],
  };
}
