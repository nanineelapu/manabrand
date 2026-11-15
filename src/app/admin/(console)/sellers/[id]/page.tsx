import { notFound } from "next/navigation";
import { SellerDetail } from "@/components/admin/seller-detail";
import { PageHeader, Panel } from "@/components/shared/blocks";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status";
import { ProductImage } from "@/components/brand/product-image";
import { getAllProducts, getAllSellers, getSellerPayouts } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export default async function SellerPage({ params }: PageProps<"/admin/sellers/[id]">) {
  const { id } = await params;
  const seller = (await getAllSellers()).find((s) => s.id === id);
  if (!seller) notFound();
  const [products, payouts] = await Promise.all([getAllProducts(), getSellerPayouts(id)]);
  const mine = products.filter((p) => p.sellerId === id);
  return (
    <>
      <PageHeader title="Seller" back={{ href: "/admin/sellers", label: "Sellers" }} />
      <SellerDetail seller={seller}>
        <Panel title={`Products (${mine.length})`} padded={false}>
          <div className="p-3 md:p-4">
            <DataTable rows={mine.slice(0, 6)} rowKey={(p) => p.id} rowHref={(p) => `/admin/products/${p.id}`} empty={<p className="p-8 text-center text-sm text-muted">No products listed yet.</p>} columns={[
              { key: "n", header: "Product", mobile: "title", cell: (p) => <span className="flex items-center gap-3"><span className="aspect-[3/4] w-9 shrink-0 overflow-hidden rounded-md"><ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.images?.[0]} /></span>{p.name}</span> },
              { key: "s", header: "Status", mobile: "right", cell: (p) => <StatusBadge status={p.status} /> },
              { key: "p", header: "Price", align: "right", cell: (p) => <span className="tabular">{formatINR(p.price)}</span> },
              { key: "so", header: "Sold", align: "right", cell: (p) => <span className="tabular text-muted">{p.sold}</span> },
            ]} />
          </div>
        </Panel>
        {payouts.length > 0 && (
          <Panel title="Recent payouts" padded={false}>
            <div className="p-3 md:p-4"><DataTable rows={payouts} rowKey={(p) => p.id} columns={[
              { key: "pe", header: "Period", mobile: "title", cell: (p) => p.period },
              { key: "st", header: "Status", mobile: "right", cell: (p) => <StatusBadge status={p.status} /> },
              { key: "g", header: "Gross", align: "right", cell: (p) => <span className="tabular">{formatINR(p.gross)}</span> },
              { key: "n", header: "Net", align: "right", cell: (p) => <span className="tabular font-medium">{formatINR(p.net)}</span> },
            ]} /></div>
          </Panel>
        )}
      </SellerDetail>
    </>
  );
}
