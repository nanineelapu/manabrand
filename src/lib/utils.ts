import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export const formatINR = (n: number) => `₹${inr.format(Math.round(n))}`;

/** ₹1.2L / ₹3.4Cr / ₹12.5K — for dashboards */
export function formatCompactINR(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2).replace(/\.?0+$/, "")}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2).replace(/\.?0+$/, "")}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `${sign}₹${abs}`;
}

export const formatNumber = (n: number) => inr.format(n);

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/** Stable relative time based on a fixed "now" so SSR and client agree. */
export const MOCK_NOW = new Date("2026-11-15T10:30:00+05:30").getTime();
export function timeAgo(iso: string) {
  const diff = Math.max(0, MOCK_NOW - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}

export const discountPct = (price: number, mrp: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function sumBy<T>(arr: T[], fn: (t: T) => number) {
  return arr.reduce((a, b) => a + fn(b), 0);
}

/** Deterministic PRNG so mock data is stable between server and client renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
