import Link from "next/link";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumb, EmptyState, Pagination } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { ActiveFilters, FilterSheetButton, FilterSidebar, SortSelect } from "@/components/store/filters";
import { ProductGrid } from "@/components/store/product-card";
import { SORTS, queryProducts, type ProductQuery } from "@/lib/data";

/** Shared listing shell: header → toolbar (sort/filter) → chips → sidebar + grid → pagination. */
export async function ListingView({
  title, subtitle, query, basePath, crumbs, subs, hero, searchParams, hideSubFilter,
}: {
  title: string; subtitle?: string; query: ProductQuery; basePath: string;
  crumbs: { label: string; href?: string }[]; subs?: string[]; hero?: React.ReactNode;
  searchParams: Record<string, string | string[] | undefined>; hideSubFilter?: boolean;
}) {
  const { items, total, page, pages, facets } = await queryProducts(query);
  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => { if (v && k !== "page") sp.set(k, Array.isArray(v) ? v[0] : v); });
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="container-page pb-6 pt-4 md:pt-6">
      <Breadcrumb items={crumbs} />
      {hero ?? (
        <div className="mt-4 md:mt-6">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-xl text-sm text-muted md:text-base">{subtitle}</p>}
        </div>
      )}

      {subs && subs.length > 0 && !hideSubFilter && (
        <nav aria-label="Subcategories" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {[undefined, ...subs].map((s) => {
            const on = (Array.isArray(searchParams.sub) ? searchParams.sub[0] : searchParams.sub) === s;
            return (
              <Link key={s ?? "all"} href={s ? `${basePath}?sub=${encodeURIComponent(s)}` : basePath} aria-current={on ? "true" : undefined}
                className={cn("inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                  on ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card hover:bg-bg-subtle")}>{s ?? "All"}</Link>
            );
          })}
        </nav>
      )}

      {/* Toolbar: sticky under header on mobile so Filter/Sort stay in thumb reach */}
      <div className="sticky top-[54px] z-30 -mx-4 mt-5 flex items-center gap-2.5 border-y border-line bg-bg px-4 py-2 shadow-[0_6px_14px_-12px_rgba(0,0,0,0.18)] sm:top-[64px] lg:static lg:top-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none">
        <p className="hidden text-sm text-muted lg:block lg:flex-1"><b className="text-fg">{total}</b> {total === 1 ? "product" : "products"}</p>
        <FilterSheetButton facets={facets} subs={hideSubFilter ? undefined : subs} total={total} />
        <SortSelect options={SORTS} />
      </div>
      <p className="mt-3 text-[13px] text-muted lg:hidden"><b className="text-fg">{total}</b> {total === 1 ? "product" : "products"}</p>
      <div className="mt-3 empty:hidden lg:mt-4"><ActiveFilters facets={facets} /></div>

      <div className="mt-5 flex gap-10 lg:mt-6">
        <FilterSidebar facets={facets} subs={hideSubFilter ? undefined : subs} />
        <div className="min-w-0 flex-1">
          {items.length ? (
            <ProductGrid products={items} className="lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4" />
          ) : (
            <EmptyState icon={<SearchX />} title="No products match" body="Try removing a filter or two to see more."
              action={<Button href={basePath} variant="outline">Clear filters</Button>} />
          )}
          <Pagination page={page} pages={pages} hrefFor={hrefFor} className="mt-10" />
        </div>
      </div>
    </div>
  );
}
