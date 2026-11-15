/**
 * Typed mirror of the CSS tokens in src/app/globals.css.
 * Use for the few places that need raw values in JS (SVG charts, ProductImage).
 * Components should use Tailwind semantic classes (bg-card, text-muted…) instead.
 */
export const brand = {
  ink: "#0d1f19",
  ivory: "#f4f8f5",
  sand: "#e3ece7",
  emerald: "#0e7a5f",
  gold: "#d4a94f",
} as const;

export const chart = {
  /** Categorical series — validated for contrast on white & ivory. */
  series: ["#0e7a5f", "#0d1f19", "#d4a94f", "#2f6fa3", "#8b6bb0", "#c0392b"],
  grid: "rgba(13,31,25,0.1)",
  axis: "#7d8f86",
} as const;

export const statusTone = {
  success: { fg: "text-success", bg: "bg-success-bg" },
  warning: { fg: "text-warning", bg: "bg-warning-bg" },
  danger: { fg: "text-danger", bg: "bg-danger-bg" },
  info: { fg: "text-info", bg: "bg-info-bg" },
  neutral: { fg: "text-muted", bg: "bg-bg-subtle" },
  accent: { fg: "text-accent-soft-fg", bg: "bg-accent-soft" },
} as const;

export type Tone = keyof typeof statusTone;

export const surfaces = ["store", "admin", "seller"] as const;
export type Surface = (typeof surfaces)[number];
