import type { Metadata, Viewport } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import { getSiteContent } from "@/lib/cms";
import { StoreHydrator } from "@/lib/stores/hydrate";
import "./globals.css";

const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap" });

/** iOS shows one of these while an installed app starts (black + dim logo + empty bar = the preloader at 0%). Made by scripts/generate-pwa-assets.mjs. */
const IOS_LAUNCH_IMAGES = ([
  [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2], [320, 568, 2],
  [834, 1194, 2], [820, 1180, 2], [1024, 1366, 2], [810, 1080, 2],
] as const).map(([w, h, r]) => ({
  url: `/pwa/splash/${w * r}x${h * r}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
}));

/** Site title, description and share image come from the CMS (Site settings) — built-in values are the fallback. */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
  title: { default: site.defaultTitle, template: site.titleTemplate },
  description: site.description,
  applicationName: site.siteName,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ManaBrand", statusBarStyle: "black-translucent", startupImage: IOS_LAUNCH_IMAGES },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/pwa/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: { title: site.defaultTitle, description: site.description, siteName: site.siteName, images: [site.ogImage ? { url: site.ogImage } : { url: "/logo.png", width: 819, height: 1024 }] },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${montserrat.variable} ${dmSans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("mb_preloaded"))document.documentElement.setAttribute("data-preloaded","true")}catch(e){}`,
          }}
        />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
      </head>
      <body className="min-h-dvh" suppressHydrationWarning>
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
