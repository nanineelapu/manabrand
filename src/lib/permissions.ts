import type { SellerPermissions } from "@/types";

/** What an admin can switch on or off for each seller. The same keys are stored in sellers.permissions (jsonb). */
export const PERMISSION_DEFS: { key: keyof SellerPermissions; label: string; desc: string }[] = [
  { key: "add_products", label: "Add & edit products", desc: "Create products and change their details, photos and prices." },
  { key: "publish_directly", label: "Publish without review", desc: "New products go live straight away. When off, each product waits for your approval." },
  { key: "manage_inventory", label: "Manage stock", desc: "Update stock levels in the Inventory screen." },
  { key: "run_promotions", label: "Run promotions", desc: "Create discounts and join marketplace events." },
  { key: "view_earnings", label: "See earnings & payouts", desc: "View sales earnings, commission and payouts." },
];

/** A normal seller: can sell and manage their own shop, but products are reviewed before going live. */
export const DEFAULT_PERMISSIONS: SellerPermissions = {
  add_products: true, publish_directly: false, manage_inventory: true, run_promotions: true, view_earnings: true,
};

/** Fills any missing key with its default, so older rows (or a database without the column yet) keep working. */
export function mergePermissions(raw: unknown): SellerPermissions {
  const out = { ...DEFAULT_PERMISSIONS };
  if (raw && typeof raw === "object") for (const k of Object.keys(out) as (keyof SellerPermissions)[]) if (typeof (raw as Record<string, unknown>)[k] === "boolean") out[k] = (raw as Record<string, boolean>)[k];
  return out;
}
