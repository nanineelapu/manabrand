"use client";

import { useMemo, useState } from "react";
import { Download, PackageSearch, Plus } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { ProductImage } from "@/components/brand/product-image";
import { DataTable } from "@/components/shared/data-table";
import { ListToolbar, useListFilter } from "@/components/shared/list-toolbar";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import { Switch } from "@/components/ui/form";
import { setProductStatus } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { cn, formatINR } from "@/lib/utils";
import type { Product, ProductStatus } from "@/types";

const total = (p: Product) => Object.values(p.stock).reduce((a, b) => a + b, 0);

export function ProductsList({ products, base, showSeller, sellerNames }: { products: Product[]; base: string; showSeller?: boolean; sellerNames?: Record<string, string> }) {
  const f = useListFilter();
  const [status, setStatus] = useState<Record<string, ProductStatus>>(() => Object.fromEntries(products.map((p) => [p.id, p.status])));
  const eff = (p: Product) => status[p.id] ?? p.status;
  const { act } = useAct();

  const rows = useMemo(() => {
    const t = f.q.trim().toLowerCase();
    return products.filter((p) => (f.tab === "all" || eff(p) === f.tab) && (!t || `${p.name} ${p.subcategory} ${p.categorySlug} ${p.id}`.toLowerCase().includes(t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, f.q, f.tab, status]);
  const count = (s: string) => (s === "all" ? products.length : products.filter((p) => eff(p) === s).length);

  return (
    <>
      <ListToolbar {...f} placeholder="Search products or SKU" tabs={[
        { value: "all", label: "All", count: count("all") }, { value: "active", label: "Active", count: count("active") },
        { value: "draft", label: "Draft", count: count("draft") }, { value: "out_of_stock", label: "Out of stock", count: count("out_of_stock") },
        { value: "pending_review", label: "In review", count: count("pending_review") },
      ]} right={<><Button variant="outline" className="h-10" onClick={() => downloadCsv(`products-${new Date().toISOString().slice(0, 10)}`, [["Name", "Category", "Sub-category", "Price (INR)", "MRP (INR)", "Stock", "Sold", "Status"], ...rows.map((p) => [p.name, p.categorySlug, p.subcategory, p.price, p.mrp, Object.values(p.stock).reduce((a, b) => a + b, 0), p.sold, p.status])])}><Download className="size-4" /> Export</Button><Button href={`${base}/products/new`} className="h-10"><Plus className="size-4" /> Add product</Button></>} />

      <DataTable rows={rows} rowKey={(p) => p.id} rowHref={(p) => `${base}/products/${p.id}`}
        empty={<EmptyState icon={<PackageSearch />} title="No products found" body="Adjust your filters or add a new product." action={<Button href={`${base}/products/new`}>Add product</Button>} />}
        columns={[
          { key: "p", header: "Product", mobile: "title", cell: (p) => (
            <span className="flex items-center gap-3"><span className="aspect-[3/4] w-10 shrink-0 overflow-hidden rounded-md"><ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.images?.[0]} /></span><span className="min-w-0"><span className="block truncate font-medium">{p.name}</span><span className="block text-xs text-muted">SKU {p.id.toUpperCase()} · {p.subcategory}</span></span></span>
          ) },
          ...(showSeller ? [{ key: "s", header: "Seller", mobile: "sub" as const, cell: (p: Product) => <span className="text-muted">{sellerNames?.[p.sellerId]}</span> }] : []),
          { key: "pr", header: "Price", align: "right" as const, mobile: "row" as const, cell: (p: Product) => <span className="tabular font-medium">{formatINR(p.price)}</span> },
          { key: "st", header: "Stock", align: "right" as const, mobile: "row" as const, cell: (p: Product) => { const t = total(p); return <span className={cn("tabular", t === 0 ? "font-semibold text-danger" : t <= 12 ? "font-semibold text-warning" : "")}>{t}</span>; } },
          { key: "sold", header: "Sold", align: "right" as const, mobile: "row" as const, cell: (p: Product) => <span className="tabular text-muted">{p.sold}</span> },
          { key: "stat", header: "Status", mobile: "right" as const, cell: (p: Product) => <StatusBadge status={eff(p)} /> },
          { key: "on", header: "Live", align: "center" as const, mobile: "hide" as const, cell: (p: Product) => (
            <span onClick={(e) => e.stopPropagation()}><Switch label={`${p.name} live`} checked={eff(p) === "active"} disabled={eff(p) === "pending_review"}
              onChange={(v) => act(() => setProductStatus(p.id, v ? "active" : "draft"), { success: v ? (base === "/seller" ? `${p.name} submitted for review` : `${p.name} is now live`) : `${p.name} moved to draft`, refresh: false,
                onOk: () => setStatus((s) => ({ ...s, [p.id]: v ? (base === "/seller" ? "pending_review" : "active") : "draft" })), onDemo: () => setStatus((s) => ({ ...s, [p.id]: v ? "active" : "draft" })) })} /></span>
          ) },
        ]} />
    </>
  );
}
