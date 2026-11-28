"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A thin bar at the very top of the screen that runs while the next page is loading. It replaces the grey placeholder
 * boxes: the page you are on stays visible and usable until the next one is ready, then it swaps in at once.
 * It starts on any in-site link tap (and on startRouteProgress() for button-driven navigation) and finishes when the URL changes.
 */
const ID = "route-progress";
let timer: ReturnType<typeof setInterval> | undefined;
let failsafe: ReturnType<typeof setTimeout> | undefined;
let value = 0;

const bar = () => document.getElementById(ID) as HTMLDivElement | null;
const paint = (v: number, fade = false) => {
  const el = bar(); if (!el) return;
  el.style.opacity = fade ? "0" : "1";
  el.style.transform = `scaleX(${v})`;
};

export function startRouteProgress() {
  if (typeof document === "undefined" || !bar()) return;
  clearInterval(timer); clearTimeout(failsafe);
  const el = bar()!; el.style.transition = "none"; value = 0; paint(0.08);
  void el.offsetWidth; el.style.transition = "transform 0.25s ease-out, opacity 0.25s ease-out";
  timer = setInterval(() => { value += (0.92 - value) * 0.12; paint(value); }, 180);   // creeps towards 92% and waits
  failsafe = setTimeout(finishRouteProgress, 10000);                                   // never get stuck
}

export function finishRouteProgress() {
  if (typeof document === "undefined" || !bar()) return;
  clearInterval(timer); clearTimeout(failsafe); timer = undefined;
  paint(1);
  setTimeout(() => { paint(1, true); setTimeout(() => { const el = bar(); if (el && !timer) { el.style.transition = "none"; paint(0, true); } }, 260); }, 140);
}

function Watcher() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  // the page changed → done
  useEffect(() => { finishRouteProgress(); }, [pathname, search]);

  // a tap on an in-site link → started
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;   // same page or just a #anchor
      startRouteProgress();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

export function RouteProgress() {
  return (
    <>
      <div id={ID} aria-hidden style={{ position: "fixed", insetInline: 0, top: 0, height: 3, zIndex: 300, transformOrigin: "left center", transform: "scaleX(0)", opacity: 0, background: "linear-gradient(90deg, #e0247a, #ff5fb0)", boxShadow: "0 0 8px rgba(224,36,122,0.6)", pointerEvents: "none" }} />
      <Suspense fallback={null}><Watcher /></Suspense>
    </>
  );
}
