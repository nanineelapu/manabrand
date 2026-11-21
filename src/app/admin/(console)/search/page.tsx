import Link from "next/link";
import { Package, ShoppingCart, Store, Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/shared/blocks";
import { StatusBadge } from "@/components/shared/status";
import { getAllCustomers, getAllOrders, getAllProducts, getAllSellers } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Search" };

const has = (hay: string, terms: string[]) => { const h = hay.toLowerCase(); return terms.every((t) => h.includes(t)); };

/** Admin-wide search: orders, customers, products and sellers in one place. */
export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const [orders, customers, products, sellers] = terms.length
    ? await Promise.all([getAllOrders(), getAllCustomers(), getAllProducts(), getAllSellers()]) : [[], [], [], []];
  const r = {
    orders: orders.filter((o) => has(`${o.number} ${o.customerName} ${o.address.phone} ${o.items.map((i) => i.name).join(" ")}`, terms)).slice(0, 8),
    customers: customers.filter((c) => has(`${c.name} ${c.email} ${c.phone} ${c.city}`, terms)).slice(0, 8),
    products: products.filter((p) => has(`${p.name} ${p.subcategory} ${p.categorySlug} ${p.id}`, terms)).slice(0, 8),
    sellers: sellers.filter((s) => has(`${s.name} ${s.owner} ${s.email} ${s.phone}`, terms)).slice(0, 8),
  };
  const total = r.orders.length + r.customers.length + r.products.length + r.sellers.length;
  const row = "flex items-center gap-3 px-4 py-3 text-sm hover:bg-bg-subtle/60 md:px-5";

  return (
    <>
      <PageHeader title={q ? `Results for “${q}”` : "Search"} subtitle={q ? `${total} match${total === 1 ? "" : "es"} across orders, customers, products and sellers` : "Type in the search bar above — order number, customer name, phone, product or store."} />
      {q && total === 0 && <p className="rounded-card border border-line bg-card p-8 text-center text-sm text-muted">Nothing found. Try a different spelling, or part of a name or phone number.</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {r.orders.length > 0 && <Panel title="Orders" padded={false}><ul className="divide-y divide-line">{r.orders.map((o) => <li key={o.id}><Link href={`/admin/orders/${o.id}`} className={row}><ShoppingCart className="size-4 text-muted" /><span className="min-w-0 flex-1"><b>{o.number}</b> <span className="text-muted">· {o.customerName}</span></span><StatusBadge status={o.status} /><span className="tabular">{formatINR(o.total)}</span></Link></li>)}</ul></Panel>}
        {r.customers.length > 0 && <Panel title="Customers" padded={false}><ul className="divide-y divide-line">{r.customers.map((c) => <li key={c.id}><Link href={`/admin/customers/${c.id}`} className={row}><Users className="size-4 text-muted" /><span className="min-w-0 flex-1"><b>{c.name}</b> <span className="text-muted">· {c.phone}</span></span><span className="tabular text-muted">{formatINR(c.spent)}</span></Link></li>)}</ul></Panel>}
        {r.products.length > 0 && <Panel title="Products" padded={false}><ul className="divide-y divide-line">{r.products.map((p) => <li key={p.id}><Link href={`/admin/products/${p.id}`} className={row}><Package className="size-4 text-muted" /><span className="min-w-0 flex-1 truncate"><b>{p.name}</b> <span className="text-muted">· {p.subcategory}</span></span><StatusBadge status={p.status} /><span className="tabular">{formatINR(p.price)}</span></Link></li>)}</ul></Panel>}
        {r.sellers.length > 0 && <Panel title="Sellers" padded={false}><ul className="divide-y divide-line">{r.sellers.map((s) => <li key={s.id}><Link href={`/admin/sellers/${s.id}`} className={row}><Store className="size-4 text-muted" /><span className="min-w-0 flex-1"><b>{s.name}</b> <span className="text-muted">· {s.owner}</span></span><StatusBadge status={s.status} /></Link></li>)}</ul></Panel>}
      </div>
    </>
  );
}
