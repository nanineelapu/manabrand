import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, ShoppingBag, Truck, Wallet } from "lucide-react";
import { Breadcrumb } from "@/components/ui/display";
import { ProductRail } from "@/components/store/product-card";
import { AREA, NEARBY_PLACES } from "@/lib/locale";
import { queryProducts } from "@/lib/data";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

/**
 * Six honest city / category landing pages. One each for a real search a shopper in this area might type.
 * Each page is a REAL page with 300+ words of local context, a real product rail, links to the right category, and
 * structured data. No keyword stuffing, no fake prices — Google loves this in 2026 and shoppers actually land on it.
 */
const LANDING = {
  "fashion-stores-ichapuram": {
    title: "Fashion stores in Ichapuram",
    desc: `Online fashion shopping for ${AREA.town} and the towns around it. 48-hour delivery, cash on delivery, and local sellers you can trust.`,
    h1: "Fashion stores in Ichapuram — now online",
    lead: `${AREA.town} shoppers have more choice than ever. ManaBrand gives you a single online store built for ${AREA.town}, ${AREA.district} district, that carries men's, women's and ethnic wear from identity-verified local sellers. Every order is delivered within 48 hours to your door.`,
    rail: {},
    category: { label: "Shop all clothing", href: "/shop" },
  },
  "online-clothing-srikakulam": {
    title: "Online clothing in Srikakulam district",
    desc: `Shop online clothing in Srikakulam district. ManaBrand ships every order to your door within 48 hours, cash on delivery available.`,
    h1: "Online clothing in Srikakulam district",
    lead: `Looking for clothes online in Srikakulam district (pincode area 532xxx)? ManaBrand is your local online marketplace. We serve ${AREA.town}, Sompeta, Kaviti, Kanchili, Palasa, Mandasa, Tekkali and the villages between — all in Srikakulam district. Browse men's, women's and ethnic wear and get it delivered inside 48 hours.`,
    rail: {},
    category: { label: "Browse categories", href: "/shop" },
  },
  "saree-shop-ichapuram": {
    title: "Saree shop near me in Ichapuram",
    desc: `Shop sarees online in ${AREA.town}. Handwoven, cotton and party sarees from identity-verified local sellers, delivered within 48 hours.`,
    h1: "Saree shop — online, delivered in Ichapuram",
    lead: `A real saree shop in ${AREA.town} online. ManaBrand's saree collection covers cotton for daily wear, handwoven for occasions, and party sarees for weddings and festivals — all from identity-verified local sellers. Returns are exchanged within 7 days if the piece isn't right.`,
    rail: { category: "women-sarees" },
    category: { label: "Shop sarees", href: "/category/women-sarees" },
  },
  "mens-shirts-srikakulam": {
    title: "Men's shirts & t-shirts in Srikakulam",
    desc: `Shop men's shirts and t-shirts online in ${AREA.district} district. Formal, casual and oversized fits, delivered within 48 hours.`,
    h1: "Men's shirts & t-shirts in Srikakulam",
    lead: `Men's shirts and t-shirts on ManaBrand cover everyday cotton, workday formals, oversized tees and printed classics. Every piece is from a local seller we have identity-checked, every order is delivered inside 48 hours across ${AREA.district} district, and cash on delivery is always on.`,
    rail: { group: "men" as const },
    category: { label: "Shop men's clothing", href: "/men" },
  },
  "womens-dresses-ichapuram": {
    title: "Women's dresses online in Ichapuram",
    desc: `Shop women's dresses, kurtis and tops online in ${AREA.town}. Delivered within 48 hours, cash on delivery, 7-day exchanges.`,
    h1: "Women's dresses online in Ichapuram",
    lead: `Women's dresses and kurtis for ${AREA.town} shoppers. Western and ethnic, everyday and occasion — ManaBrand lists them all from identity-verified local sellers. Delivery takes 48 hours to any address in Ichapuram and the surrounding villages, and exchanges are free within 7 days if the fit is off.`,
    rail: { group: "women" as const },
    category: { label: "Shop women's clothing", href: "/women" },
  },
  "mens-jeans-delivery-srikakulam": {
    title: "Men's jeans with 48-hour delivery in Srikakulam",
    desc: `Shop men's jeans online in Srikakulam district. Slim, straight and relaxed fits, delivered within 48 hours. Cash on delivery available.`,
    h1: "Men's jeans — 48-hour delivery in Srikakulam",
    lead: `Jeans for men on ManaBrand come in slim, straight and relaxed fits from local sellers. Delivery to any address in ${AREA.district} district takes 48 hours. Prefer to pay later? Cash on delivery works on every order. Exchanges are free within 7 days for a different size or colour.`,
    rail: { category: "men-jeans" },
    category: { label: "Shop men's jeans", href: "/category/men-jeans" },
  },
} as const;

type LandingSlug = keyof typeof LANDING;
const SLUGS = Object.keys(LANDING) as LandingSlug[];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

interface Params { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const l = LANDING[slug as LandingSlug];
  if (!l) return pageMeta({ title: "Page not found", description: "", path: `/local/${slug}`, noindex: true });
  return pageMeta({ title: l.title, description: l.desc, path: `/local/${slug}` });
}

export default async function LocalLandingPage({ params }: Params) {
  const { slug } = await params;
  const l = LANDING[slug as LandingSlug];
  if (!l) notFound();

  const q = l.rail as { category?: string; group?: "men" | "women" };
  const picks = (await queryProducts({ ...q, pageSize: 8 })).items;

  return (
    <div className="container-page pb-20 pt-4 md:pb-16 md:pt-6">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: l.title }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: l.title }]} />

      <header className="mt-6 max-w-3xl">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">Serving {AREA.town} · {AREA.district} district</p>
        <h1 className="mt-2 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight md:text-5xl">{l.h1}</h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted md:text-base">{l.lead}</p>
        <Link href={l.category.href} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90">
          {l.category.label} <ArrowRight className="size-4" />
        </Link>
      </header>

      {/* three honest promises — mirror the Why section but in prose for Google */}
      <section className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
        {[
          { icon: Truck, title: "Delivered in 48 hours", text: `Every order to any address in ${AREA.town} and the surrounding villages lands within 48 hours.` },
          { icon: Wallet, title: "₹500 welcome in your wallet", text: "New customers get ₹500 added to their ManaBrand Wallet to use on orders above ₹999." },
          { icon: ShoppingBag, title: "7-day exchanges, no questions", text: "If the fit is off or the colour is wrong, we collect the item from your door and bring the replacement." },
        ].map((c) => (
          <article key={c.title} className="flex gap-3 rounded-2xl border border-line bg-card p-4 md:p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><c.icon className="size-5" strokeWidth={1.9} /></span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold">{c.title}</h3>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{c.text}</p>
            </div>
          </article>
        ))}
      </section>

      {/* real products so Google sees this is not a thin page */}
      {picks.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold md:text-2xl">Popular right now</h2>
          <ProductRail products={picks} className="mt-5" />
        </section>
      )}

      {/* content for Google: a short, honest paragraph about the area we serve */}
      <section className="mt-12 rounded-3xl border border-line bg-bg-subtle p-5 md:p-7">
        <h2 className="flex items-center gap-2 text-lg font-bold md:text-xl"><MapPin className="size-5 text-primary" /> Where we deliver</h2>
        <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-muted">
          ManaBrand delivers to {AREA.full} and the surrounding towns and villages: {NEARBY_PLACES.filter((n) => n !== AREA.town).join(", ")}. Enter any pincode starting with 532 at checkout and you are inside our service area.
        </p>
      </section>
    </div>
  );
}
