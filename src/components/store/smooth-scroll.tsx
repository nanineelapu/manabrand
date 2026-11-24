"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Lenis from "lenis";

/** Minimal handle other components (Sheet) use to pause scrolling while an overlay is open. */
export type LenisHandle = { stop: () => void; start: () => void };
declare global { interface Window { __lenis?: LenisHandle } }

/**
 * Lenis smooth scrolling for the storefront. Touch devices keep native momentum scrolling;
 * visitors who ask for reduced motion get the browser's normal scrolling.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ duration: 0.85, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.current = l; window.__lenis = l;
    let raf = 0;
    const loop = (time: number) => { l.raf(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); l.destroy(); lenis.current = null; delete window.__lenis; };
  }, []);

  // new page → start at the top if no hash (Lenis keeps its own position otherwise)
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hash) {
      lenis.current?.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return null;
}
