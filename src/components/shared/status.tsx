import { Badge } from "@/components/ui/display";
import type { Tone } from "@/lib/design/tokens";

const map: Record<string, { label: string; tone: Tone }> = {
  // orders
  placed: { label: "Placed", tone: "info" },
  confirmed: { label: "Confirmed", tone: "info" },
  packed: { label: "Packed", tone: "warning" },
  shipped: { label: "Shipped", tone: "accent" },
  out_for_delivery: { label: "Out for delivery", tone: "accent" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  returned: { label: "Returned", tone: "neutral" },
  // payments
  paid: { label: "Paid", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  refunded: { label: "Returned", tone: "neutral" },
  failed: { label: "Failed", tone: "danger" },
  // products / generic
  active: { label: "Active", tone: "success" },
  draft: { label: "Draft", tone: "neutral" },
  out_of_stock: { label: "Out of stock", tone: "danger" },
  pending_review: { label: "In review", tone: "warning" },
  // sellers / kyc
  suspended: { label: "Suspended", tone: "danger" },
  rejected: { label: "Rejected", tone: "danger" },
  verified: { label: "Verified", tone: "success" },
  // returns
  requested: { label: "Requested", tone: "warning" },
  approved: { label: "Approved", tone: "info" },
  picked_up: { label: "Picked up", tone: "accent" },
  // payouts
  processing: { label: "Processing", tone: "info" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  on_hold: { label: "On hold", tone: "danger" },
  // coupons / banners
  expired: { label: "Expired", tone: "neutral" },
  paused: { label: "Paused", tone: "warning" },
  live: { label: "Live", tone: "success" },
  // reviews
  published: { label: "Published", tone: "success" },
  flagged: { label: "Flagged", tone: "danger" },
  // customers
  blocked: { label: "Blocked", tone: "danger" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const m = map[status] ?? { label: status.replace(/_/g, " "), tone: "neutral" as Tone };
  return <Badge tone={m.tone} dot className={className}>{m.label}</Badge>;
}

export const statusLabel = (s: string) => map[s]?.label ?? s;
