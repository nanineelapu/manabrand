"use client";

import { useEffect, useRef, useState } from "react";
import { LogoImage } from "@/components/brand/logo";

const MIN_MS = 320;  // snappy minimum duration on first visit
const MAX_MS = 750;  // failsafe maximum time
const EXIT_MS = 320;  // length of the exit animation
const FLASH_MS = 140; // short complete flash

/**
 * Splash screen. The ManaBrand logo fills up from the bottom as the page loads, a big counter runs 0 → 100%, and a thin
 * bar with a moving shine tracks it. When the hero photo is ready (and the minimum time has passed) it reaches 100%,
 * flashes, and the screen splits open (top half up, bottom half down) to reveal the page.
 * It plays only on the first visit in a session. On repeat visits in the same session, it is skipped immediately.
 */
export function Preloader() {
  const [phase, setPhase] = useState<"in" | "full" | "out" | "gone">(() => {
    if (typeof window !== "undefined") {
      try {
        if (sessionStorage.getItem("mb_preloaded") || document.documentElement.hasAttribute("data-preloaded")) {
          return "gone";
        }
      } catch {}
    }
    return "in";
  });
  const fill = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "gone") return;
    if (sessionStorage.getItem("mb_preloaded") || document.documentElement.hasAttribute("data-preloaded")) {
      document.documentElement.setAttribute("data-preloaded", "true");
      return;
    }

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
      const target = ready && t >= MIN_MS ? 100 : Math.min(90, 90 * (1 - Math.exp(-t / 300)));
      shown += (target - shown) * (1 - Math.pow(0.004, dt / 350));
      if (target === 100 && shown > 98) shown = 100;
      paint(shown);
      if (shown >= 100 && !finished) {
        finished = true;
        setPhase("full");
        timers.push(setTimeout(() => {
          setPhase("out");
          html.style.overflow = "";
          try {
            sessionStorage.setItem("mb_preloaded", "true");
            document.documentElement.setAttribute("data-preloaded", "true");
          } catch {}
          window.__lenis?.start();
          timers.push(setTimeout(() => setPhase("gone"), EXIT_MS));
        }, FLASH_MS));
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      html.style.overflow = "";
      try {
        sessionStorage.setItem("mb_preloaded", "true");
        document.documentElement.setAttribute("data-preloaded", "true");
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
