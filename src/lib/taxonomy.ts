import type { PhotoKind } from "@/lib/images";

/**
 * The fashion taxonomy — the single source of truth for categories and sub-categories.
 *   group (Men / Women)  →  category (T-Shirts, Sarees…)  →  sub-category (Polo, Silk…)
 * In the database a category row is one "category" (slug `men-t-shirts`); the group comes from the slug prefix.
 */
export type GroupId = "men" | "women";
export interface TaxCategory { slug: string; group: GroupId | null; name: string; photo: PhotoKind; subs: string[]; comingSoon?: boolean }

export const GROUPS: { id: GroupId; name: string; title: string; possessive: string }[] = [
  { id: "men", name: "Men", title: "Men's Fashion", possessive: "Men's" },
  { id: "women", name: "Women", title: "Women's Fashion", possessive: "Women's" },
];

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const cat = (group: GroupId, name: string, photo: PhotoKind, subs: string[]): TaxCategory => ({ slug: `${group}-${slugify(name)}`, group, name, photo, subs });

export const TAXONOMY: TaxCategory[] = [
  // ---- Men's Fashion
  cat("men", "T-Shirts", "tee", ["Polo", "Oversized", "Baggy", "Regular Fit", "Slim Fit", "Printed", "Plain"]),
  cat("men", "Shirts", "shirt", ["Casual", "Formal", "Checked", "Printed", "Denim", "Oversized"]),
  cat("men", "Jeans", "jeans", ["Skinny Fit", "Slim Fit", "Straight Fit", "Baggy Fit", "Relaxed Fit", "Bootcut"]),
  cat("men", "Pants & Trousers", "jeans", ["Formal Pants", "Chinos", "Cargo Pants", "Joggers", "Track Pants"]),
  cat("men", "Ethnic Wear", "kurta", ["Kurtas", "Kurta Sets", "Sherwanis", "Traditional Sets"]),
  cat("men", "Shorts", "jeans", ["Denim Shorts", "Cargo Shorts", "Cotton Shorts", "Casual Shorts"]),
  // ---- Women's Fashion
  cat("women", "Tops & T-Shirts", "tee", ["Crop Tops", "Oversized", "Basic Tops", "Tank Tops", "Polo T-Shirts", "Printed Tops"]),
  cat("women", "Kurtis & Kurtas", "kurta", ["Straight Kurtis", "A-Line Kurtis", "Anarkali", "Short Kurtis", "Long Kurtis"]),
  cat("women", "Sarees", "saree", ["Cotton", "Silk", "Georgette", "Printed", "Party Wear"]),
  cat("women", "Dresses", "dress", ["Mini Dresses", "Midi Dresses", "Maxi Dresses", "Bodycon", "A-Line"]),
  cat("women", "Jeans", "jeans", ["Skinny Fit", "Straight Fit", "Wide Leg", "Baggy Fit", "Mom Fit", "Bootcut"]),
  cat("women", "Pants & Leggings", "jeans", ["Palazzo", "Leggings", "Straight Pants", "Wide Leg Pants", "Cargo Pants"]),
  cat("women", "Ethnic Wear", "kurta", ["Salwar Suits", "Churidar Sets", "Anarkali Sets", "Lehenga Sets", "Ethnic Co-ord Sets"]),
  // ---- launching soon
  { slug: "footwear", group: null, name: "Footwear", photo: "sneaker", subs: [], comingSoon: true },
];

export const COMING_SOON = new Set(TAXONOMY.filter((c) => c.comingSoon).map((c) => c.slug));
export const groupOf = (slug: string): GroupId | null => (slug.startsWith("men-") ? "men" : slug.startsWith("women-") ? "women" : null);

/** "men-jeans" → "Men's Jeans" (category names repeat across Men / Women, so pages and admin lists use this). */
export function catTitle(slug: string, name?: string): string {
  const t = TAXONOMY.find((c) => c.slug === slug);
  const base = name ?? t?.name ?? slug;
  const g = GROUPS.find((x) => x.id === groupOf(slug));
  return g ? `${g.possessive} ${base}` : base;
}
