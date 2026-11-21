import { LogoImage } from "@/components/brand/logo";

export const metadata = { title: "You’re offline" };

/** Shown by the service worker when there is no connection. Fully static so it can be cached. */
export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-black px-6 text-center text-white">
      <div className="max-w-sm">
        <LogoImage size="lg" invert className="mx-auto" />
        <h1 className="mt-6 text-3xl font-black tracking-tight">You’re offline</h1>
        <p className="mt-3 text-white/70">Check your internet connection and try again — ManaBrand will be right here.</p>
        {/* plain link on purpose: a full reload is what we want after the connection comes back */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="mt-7 inline-flex h-12 items-center rounded-2xl bg-[#e0247a] hover:bg-[#b51a5c] px-8 font-bold text-white transition-colors">Try again</a>
      </div>
    </main>
  );
}
