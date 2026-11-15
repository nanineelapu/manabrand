import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Package, Star, Users } from "lucide-react";
import { FollowButton } from "@/components/store/follow-button";
import { ListingView } from "@/components/store/listing-view";
import { getActiveSellers, getFollowState, getSellerBySlug } from "@/lib/data";
import { parseListingParams } from "@/lib/listing";
import { formatDate, formatNumber } from "@/lib/utils";

export async function generateStaticParams() {
  return (await getActiveSellers()).map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({ params }: PageProps<"/sellers/[slug]">) {
  const s = await getSellerBySlug((await params).slug);
  return { title: s?.name ?? "Maker" };
}

export default async function SellerPage({ params, searchParams }: PageProps<"/sellers/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const s = await getSellerBySlug(slug);
  if (!s || s.status !== "active") notFound();
  const follow = await getFollowState(s.id);

  const hero = (
    <section className="mt-4 overflow-hidden rounded-[28px] border border-line bg-card md:mt-6">
      <div className="h-28 md:h-40" style={{ background: `linear-gradient(120deg, ${s.tone[0]}, ${s.tone[1]})` }} />
      <div className="relative px-5 pb-6 md:px-8">
        <span className="-mt-10 grid size-20 place-items-center rounded-3xl border-4 border-card font-display text-4xl font-semibold text-white shadow-card md:-mt-12 md:size-24" style={{ background: s.tone[1] }}>{s.name[0]}</span>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-3xl font-semibold leading-tight md:text-4xl">{s.name} <BadgeCheck className="size-6 text-info" aria-label="Verified maker" /></h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin className="size-4" /> {s.city}, {s.state} · Joined {formatDate(s.joined, { month: "short", year: "numeric" })}</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-base">{s.blurb}</p>
          </div>
          <FollowButton sellerId={s.id} name={s.name} initialFollowing={follow.following} />
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-5 text-center md:max-w-md">
          {[[Star, "Rating", s.rating.toFixed(1)], [Users, "Followers", formatNumber(s.followers)], [Package, "Styles", String(s.productCount)]].map(([I, l, v]) => {
            const Icon = I as typeof Star;
            return <div key={l as string}><dt className="flex items-center justify-center gap-1 text-xs text-muted"><Icon className="size-3.5" />{l as string}</dt><dd className="mt-0.5 text-lg font-semibold tabular">{v as string}</dd></div>;
          })}
        </dl>
      </div>
    </section>
  );

  return (
    <ListingView title={s.name} basePath={`/sellers/${slug}`} hero={hero} hideSubFilter
      crumbs={[{ label: "Home", href: "/" }, { label: "Makers" }, { label: s.name }]}
      query={{ ...parseListingParams(sp), sellers: [s.id] }} searchParams={sp} />
  );
}
