"use client";

import { useEffect, useRef, useState } from "react";
import { LogoImage } from "@/components/brand/logo";

const MIN_MS = 1900;  // long enough for the logo to fill up and the counter to be read
const MAX_MS = 3400;  // never keep a visitor waiting longer than this, whatever is still loading
const EXIT_MS = 950;  // length of the "doors open" exit (matches the CSS)
const FLASH_MS = 420; // the short "complete" flash at 100%

/**
 * Splash screen. The ManaBrand logo fills up from the bottom as the page loads, a big counter runs 0 → 100%, and a thin
 * bar with a moving shine tracks it. When the hero photo is ready (and the minimum time has passed) it reaches 100%,
 * flashes, and the screen splits open (top half up, bottom half down) to reveal the page.
 * The percentage is eased: it climbs quickly to ~90% while things load, then completes once the page is really ready.
 * It plays on every fresh page load, not when moving between pages. The overlay is part of the server HTML (no flash of the
 * page underneath); if JavaScript never runs, a CSS failsafe removes it after 5 seconds.
 */
export function Preloader() {
  const [phase, setPhase] = useState<"in" | "full" | "out" | "gone">("in");
  const fill = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.style.overflow = "hidden";
    window.__lenis?.stop();

    const hero = document.querySelector<HTMLImageElement>("section[aria-label='Featured'] img");
    const heroReady = new Promise<void>((resolve) => {
      if (!hero || hero.complete) return resolve();
      hero.addEventListener("load", () => resolve(), { once: true });
      hero.addEventListener("error", () => resolve(), { once: true });
    });
    let ready = false;
    Promise.race([heroReady, new Promise<void>((r) => setTimeout(r, MAX_MS))]).then(() => { ready = true; });

    const t0 = performance.now();
    let last = t0, shown = 0, raf = 0, finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const paint = (v: number) => {
      const r = Math.min(100, Math.round(v));
      if (num.current) num.current.textContent = String(r);
      fill.current?.style.setProperty("--p", `${v.toFixed(1)}%`);
      if (bar.current) { bar.current.style.transform = `scaleX(${(v / 100).toFixed(3)})`; bar.current.parentElement?.setAttribute("aria-valuenow", String(r)); }
    };
    const loop = (now: number) => {
      const dt = Math.min(64, now - last); last = now;
      const t = now - t0;
      // while loading: ease towards 90%. Once ready (and past the minimum time): go to 100%.
      const target = ready && t >= MIN_MS ? 100 : Math.min(90, 90 * (1 - Math.exp(-t / 850)));
      shown += (target - shown) * (1 - Math.pow(0.004, dt / 1000));
      if (target === 100 && shown > 99.4) shown = 100;
      paint(shown);
      if (shown >= 100 && !finished) {
        finished = true;
        setPhase("full");
        timers.push(setTimeout(() => {
          setPhase("out");
          html.style.overflow = "";
          window.__lenis?.start();
          timers.push(setTimeout(() => setPhase("gone"), EXIT_MS));
        }, FLASH_MS));
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); html.style.overflow = ""; };
  }, []);

  if (phase === "gone") return null;
  return (
    <div id="preloader" data-round data-phase={phase} role="status" aria-live="polite" aria-label="Loading ManaBrand">
      <div className="pl-half pl-top" />
      <div className="pl-half pl-bottom" />
      <div className="pl-center">
        <div aria-hidden className="pl-aurora" />
        <div className="pl-stage">
          {/* the logo: dim outline underneath, the real logo revealed from the bottom up as it loads */}
          <div ref={fill} className="pl-logo-wrapper" style={{ ["--p" as string]: "0%" }}>
            <LogoImage size="3xl" priority invert className="pl-logo pl-logo-base h-40 sm:h-52 md:h-60 w-auto max-w-[80vw] sm:max-w-[400px]" />
            <LogoImage size="3xl" invert className="pl-logo pl-logo-top h-40 sm:h-52 md:h-60 w-auto max-w-[80vw] sm:max-w-[400px]" />
            <div aria-hidden className="pl-sheen" />
          </div>
          <div className="pl-track" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
            <div ref={bar} className="pl-bar" />
          </div>
        </div>
        <div className="pl-meta">
          <p className="pl-pct" aria-hidden><b ref={num}>0</b><span>%</span></p>
          <p className="pl-tag">Local fashion<br />Ichapuram · Srikakulam</p>
        </div>
      </div>
    </div>
  );
}
