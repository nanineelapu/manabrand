"use client";

import { useEffect, useState } from "react";
import { LogoImage } from "@/components/brand/logo";

const MIN_MS = 1400;  // long enough for the logo animation + progress bar to play once
const MAX_MS = 3200;  // never keep a visitor waiting longer than this, whatever is still loading
const EXIT_MS = 950;  // length of the "doors open" exit (matches the CSS)

/**
 * Splash screen: the logo animates in on black with a pulsing red ring and a progress bar, then the screen splits open
 * (top half up, bottom half down) to reveal the page. It only waits for what the visitor needs to see — the hero photo —
 * not for the whole page. It plays on every fresh page load (opening the site or pressing refresh), not when moving
 * between pages. The overlay is part of the server HTML (so there is no flash of the page underneath); if JavaScript
 * never runs, a CSS failsafe removes it after 5 seconds.
 */
export function Preloader() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = "hidden";
    window.__lenis?.stop();
    const t0 = performance.now();

    // ready = the hero photo is there (or no hero on this page)
    const hero = document.querySelector<HTMLImageElement>("section[aria-label='Featured'] img");
    const heroReady = new Promise<void>((resolve) => {
      if (!hero || hero.complete) return resolve();
      hero.addEventListener("load", () => resolve(), { once: true });
      hero.addEventListener("error", () => resolve(), { once: true });
    });
    const cap = new Promise<void>((resolve) => setTimeout(resolve, MAX_MS));

    let exit: ReturnType<typeof setTimeout>;
    let gone: ReturnType<typeof setTimeout>;
    Promise.race([heroReady, cap]).then(() => {
      const wait = Math.max(0, MIN_MS - (performance.now() - t0));
      exit = setTimeout(() => {
        setPhase("out");
        html.style.overflow = "";
        window.__lenis?.start();
        gone = setTimeout(() => setPhase("gone"), EXIT_MS);
      }, wait);
    });

    return () => { clearTimeout(exit); clearTimeout(gone); html.style.overflow = ""; };
  }, []);

  if (phase === "gone") return null;
  return (
    <div id="preloader" data-round data-phase={phase} role="status" aria-live="polite" aria-label="Loading ManaBrand">
      <div className="pl-half pl-top" />
      <div className="pl-half pl-bottom" />
      <div className="pl-center">
        <div className="pl-mark">
          <span aria-hidden className="pl-ring" />
          <LogoImage size="xl" priority className="pl-logo h-28 sm:h-36" />
        </div>
        <div aria-hidden className="pl-bar"><span /></div>
      </div>
    </div>
  );
}
