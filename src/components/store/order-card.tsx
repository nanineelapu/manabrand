import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { StatusBadge } from "@/components/shared/status";
import { formatDate, formatINR } from "@/lib/utils";
import type { Order } from "@/types";

export function OrderCard({ order: o }: { order: Order }) {
  return (
    <Link href={`/account/orders/${o.id}`} className="block rounded-card border border-line bg-card p-4 shadow-card transition-colors hover:bg-bg-subtle/40 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold">{o.number}</p><p className="text-xs text-muted">Placed {formatDate(o.createdAt)}</p></div>
        <StatusBadge status={o.status} />
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        {o.items.slice(0, 4).map((it, i) => <span key={i} className="size-16 overflow-hidden rounded-xl md:size-20"><ProductImage photo={it.photo} seed={it.productId} color={it.colorHex} src={it.image} /></span>)}
        {o.items.length > 4 && <span className="grid size-16 place-items-center rounded-xl bg-bg-subtle text-sm font-medium md:size-20">+{o.items.length - 4}</span>}
        <ChevronRight className="ml-auto size-5 shrink-0 text-subtle" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="min-w-0 truncate text-muted">{o.items[0].name}{o.items.length > 1 ? ` + ${o.items.length - 1} more` : ""}</span>
        <span className="shrink-0 pl-3 font-semibold tabular">{formatINR(o.total)}</span>
      </div>
    </Link>
  );
}
