"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---- tiny shared store for the browser's "install" event (it fires once, several components need it) ---- */
interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }
let deferred: InstallEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let wired = false;
function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as InstallEvent; emit(); });
  window.addEventListener("appinstalled", () => { deferred = null; installed = true; emit(); });
}
const subscribe = (l: () => void) => { wire(); listeners.add(l); return () => { listeners.delete(l); }; };
const version = () => `${deferred ? 1 : 0}${installed ? 1 : 0}`;

const isStandalone = () => typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream;

/** What the page can offer: a real install prompt (Chrome / Edge / Android) or, on iPhone / iPad, the Share-sheet steps. */
export function useInstallApp() {
  useSyncExternalStore(subscribe, version, () => "00");
  const standalone = isStandalone();
  const ios = isIOS();
  const canPrompt = !!deferred && !standalone && !installed;
  return {
    canPrompt,
    /** already running as an installed app (home-screen icon / app drawer) */
    installed: standalone || installed,
    needsIOSSteps: ios && !standalone && !installed && !deferred,
    available: !standalone && !installed && (canPrompt || ios),
    async install() {
      if (!deferred) return;
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") installed = true;
      deferred = null; emit();
    },
  };
}

/** Registers the service worker (production only — in development it would cache half-finished code). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const reg = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    if (document.readyState === "complete") reg(); else window.addEventListener("load", reg, { once: true });
  }, []);
  return null;
}

/** Plain button for the footer / menu. Renders nothing when the app is already installed or can't be installed. */
export function InstallButton({ className, label = "Install app" }: { className?: string; label?: string }) {
  const app = useInstallApp();
  const [help, setHelp] = useState(false);
  if (!app.available) return null;
  return (
    <>
      <button type="button" onClick={() => (app.canPrompt ? app.install() : setHelp(true))}
        className={cn("inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-white/40", className)}>
        <Download className="size-4" />{label}
      </button>
      {help && <InstallSteps onClose={() => setHelp(false)} />}
    </>
  );
}

/** Step-by-step help for browsers that cannot show the install prompt themselves (iPhone Safari, Firefox, in-app browsers). */
export function InstallSteps({ onClose }: { onClose: () => void }) {
  const ios = isIOS();
  return (
    <div role="dialog" aria-label="Install ManaBrand" data-round className="fixed inset-x-3 bottom-[calc(var(--tabbar-h)+8px)] z-[60] rounded-3xl border border-black/10 bg-white p-5 text-neutral-900 shadow-[0_16px_48px_rgba(0,0,0,0.18)] lg:bottom-6 lg:left-auto lg:right-6 lg:w-[360px]">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"><X className="size-4" /></button>
      <p className="font-bold text-neutral-900">Add ManaBrand to your Home Screen</p>
      {ios ? (
        <ol className="mt-3 space-y-2 text-sm text-neutral-700">
          <li>1. Tap the <Share className="mx-0.5 inline size-4 align-text-bottom" /> <b>Share</b> button in Safari.</li>
          <li>2. Scroll down and tap <b>Add to Home Screen</b>.</li>
          <li>3. Tap <b>Add</b> — the ManaBrand icon appears on your phone.</li>
        </ol>
      ) : (
        <ol className="mt-3 space-y-2 text-sm text-neutral-700">
          <li>1. Open your browser menu (<b>⋮</b> or <b>⋯</b>).</li>
          <li>2. Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
          <li>3. Confirm — ManaBrand appears on your home screen and in your app drawer.</li>
        </ol>
      )}
    </div>
  );
}

const KEY = "mana-install-dismissed";
/** A small, dismissible "Install the app" card. Appears a few seconds after arriving, never again for 2 weeks once closed. */
export function InstallBanner() {
  const app = useInstallApp();
  const [show, setShow] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    let dismissedAt = 0;
    try { dismissedAt = Number(localStorage.getItem(KEY) ?? 0); } catch { /* private mode */ }
    if (Date.now() - dismissedAt < 14 * 86400000) return;
    const t = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const close = () => { setShow(false); try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ } };
  if (!show || !app.available) return null;
  if (help) return <InstallSteps onClose={() => { setHelp(false); close(); }} />;

  return (
    <div role="region" aria-label="Install the app" data-round className="animate-pop-in fixed inset-x-3 bottom-[calc(var(--tabbar-h)+8px)] z-[55] mx-auto flex max-w-md items-center gap-3 rounded-3xl border border-black/10 bg-white p-3 pr-2 text-neutral-900 shadow-[0_12px_40px_rgba(0,0,0,0.14)] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[380px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/favicon/android-chrome-192x192.png" alt="" className="size-12 shrink-0 rounded-2xl bg-neutral-100 p-1 object-contain" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-neutral-900">Get the ManaBrand app</p>
      </div>
      <button type="button" onClick={() => (app.canPrompt ? app.install().then(close) : setHelp(true))} className="h-10 shrink-0 rounded-full bg-[#e0247a] hover:bg-[#b51a5c] px-4 text-sm font-bold text-white shadow-sm transition-colors">Install</button>
      <button type="button" aria-label="Not now" onClick={close} className="grid size-8 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"><X className="size-4" /></button>
    </div>
  );
}
