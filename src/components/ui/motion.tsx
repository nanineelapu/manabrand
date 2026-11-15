"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Calls `cb` once, the first time the element is (almost) on screen. Falls back to "now" without IntersectionObserver. */
function useInView<T extends Element>(rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined" || reduced()) { const t = setTimeout(() => setSeen(true), 0); return () => clearTimeout(t); }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); } }, { rootMargin, threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, rootMargin]);
  return [ref, seen] as const;
}

/** Fades + lifts its children in the first time they scroll into view. `delay` (ms) staggers siblings. */
export function Reveal({ children, className, delay = 0, as: Tag = "div", ...aria }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "article"; "aria-label"?: string; "aria-labelledby"?: string }) {
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <Tag ref={ref as never} {...aria} data-reveal={seen ? "in" : "out"} style={delay ? { transitionDelay: `${delay}ms` } : undefined} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}

/**
 * Counts a formatted figure up from zero when it scrolls into view: "₹1,24,500" · "1,284" · "92.4%" · "4.8★".
 * Keeps prefix/suffix and Indian digit grouping; text that has no number is shown as-is.
 */
export function CountUp({ value, duration = 900, className }: { value: string; duration?: number; className?: string }) {
  const m = /^(\D*)(\d[\d,]*)(\.\d+)?(.*)$/.exec(value);
  const [ref, seen] = useInView<HTMLSpanElement>("0px");
  const [n, setN] = useState(m ? 0 : 0);
  useEffect(() => {
    if (!m || !seen) return;
    const target = Number(m[2].replace(/,/g, "") + (m[3] ?? ""));
    if (reduced() || !Number.isFinite(target)) { const t = setTimeout(() => setN(target), 0); return () => clearTimeout(t); }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(target * (1 - Math.pow(1 - p, 3))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, value]);
  if (!m) return <span className={className}>{value}</span>;
  const decimals = m[3] ? m[3].length - 1 : 0;
  const lakh = m[2].includes(",") && /,\d{2},\d{3}/.test(m[2]);
  const shown = n.toLocaleString(lakh || m[2].includes(",") ? "en-IN" : "en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: m[2].includes(",") });
  return <span ref={ref} className={className} aria-label={value}>{m[1]}{seen ? shown : (0).toFixed(decimals)}{m[4]}</span>;
}
