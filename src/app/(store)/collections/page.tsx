import Link from "next/link";
import { ProductImage } from "@/components/brand/product-image";
import { Breadcrumb } from "@/components/ui/display";
import { getCollections } from "@/lib/data";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const cols = await getCollections();
  return (
    <div className="container-page pb-6 pt-4 md:pt-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:mt-6 md:text-4xl">Collections</h1>
      <p className="mt-1.5 max-w-xl text-sm text-muted md:text-base">Hand-picked edits across fashion, tech and home.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-5">
        {cols.map((c) => (
          <Link key={c.id} href={`/collections/${c.slug}`} className="group relative isolate aspect-[16/10] overflow-hidden rounded-[28px] border border-white/70 shadow-card">
            <div className="size-full transition-transform duration-500 group-hover:scale-105"><ProductImage photo={c.photo} seed={c.slug} w={900} h={560} sizes="50vw" rounded={false} /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <div className="glass-dark absolute inset-x-3 bottom-3 rounded-2xl border p-4 text-white md:inset-x-4 md:bottom-4">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <p className="mt-0.5 line-clamp-1 text-[13px] text-white/75">{c.story}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
