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
      // black-background versions of the logo: Android draws the launch screen from these on the black background_color,
      // so it looks like the website's preloader (the old transparent icon had black lettering that vanished on black)
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Shop", url: "/shop", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
      { name: "My orders", url: "/account/orders", icons: [{ src: "/pwa/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
