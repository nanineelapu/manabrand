import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingView } from "@/components/store/listing-view";
import { getCategories } from "@/lib/data";
import { GROUPS, groupOf } from "@/lib/fashion";
import { parseListingParams } from "@/lib/listing";

export const dynamicParams = false;
export const generateStaticParams = () => GROUPS.map((g) => ({ group: g.id }));

const BLURB = {
  men: "T-shirts, shirts, jeans, trousers, ethnic wear and shorts from local makers.",
  women: "Tops, kurtis, sarees, dresses, jeans, leggings and ethnic wear from local makers.",
} as const;

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  const g = GROUPS.find((x) => x.id === group);
  return { title: g ? g.title : "Shop" };
}

/** Men's / Women's landing: category chips on top, then every product in that group with the usual filters. */
export default async function GroupPage({ params, searchParams }: { params: Promise<{ group: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { group } = await params;
  const g = GROUPS.find((x) => x.id === group);
  if (!g) notFound();
  const sp = await searchParams;
  const cats = (await getCategories()).filter((c) => groupOf(c.slug) === g.id);
  return (
    <ListingView title={g.title} basePath={`/${g.id}`} crumbs={[{ label: "Home", href: "/" }, { label: g.name }]}
      query={{ ...parseListingParams(sp), group: g.id }} searchParams={sp} hideSubFilter
      hero={
        <div className="mt-4 md:mt-6">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{g.title}</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted md:text-base">{BLURB[g.id]}</p>
          <nav aria-label="Categories" className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {cats.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="inline-flex h-10 shrink-0 items-center rounded-full border border-line-strong bg-card px-4 text-sm font-medium transition-colors hover:bg-bg-subtle">{c.name}</Link>
            ))}
          </nav>
        </div>
      } />
  );
}
