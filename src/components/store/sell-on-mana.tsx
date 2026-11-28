import Link from "next/link";
import { ArrowRight, Boxes, LineChart, Megaphone, Store, Truck, Wallet } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";

/**
 * "Sell on ManaBrand" — a themed strip above the footer that tells makers and shop owners they can list their products.
 * Dark ink with pink accents so it reads as the brand's own voice, not a generic marketing block.
 * Nothing animates on scroll; a single rise-in on first paint matches the other home sections.
 */

const PERKS = [
  { icon: Wallet,     title: "Easy payouts",      text: "Settlements straight to your bank, every week." },
  { icon: Truck,      title: "We handle delivery", text: "Our own team picks up and drops off — no courier hassle." },
  { icon: Megaphone,  title: "Local reach",       text: "Every listing shown to shoppers in and around Ichapuram first." },
  { icon: LineChart,  title: "Real-time dashboard", text: "Orders, stock, payouts and reviews — all in one place." },
  { icon: Boxes,      title: "Simple listings",   text: "Add a product in minutes with photos, sizes and colours." },
  { icon: Store,      title: "Your own storefront", text: "A dedicated seller page with your logo, story and reviews." },
] as const;

export function SellOnMana() {
  return (
    <section aria-labelledby="sell-h" data-round className="bg-ink text-white">
      <div className="container-page py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
          {/* left: the pitch */}
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">For sellers · Ichapuram</p>
            <h2 id="sell-h" className="mt-3 font-display text-[36px] font-extrabold leading-[1.05] tracking-tight md:text-5xl">
              Sell on <span className="text-primary">ManaBrand</span>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 md:text-base">
              Already making clothes, running a shop, or sewing to order in your home? Join Ichapuram&rsquo;s own fashion marketplace
              and reach every shopper in town — with delivery, payments and support handled for you.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/seller/register"
                className="shine inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                Start selling <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/seller/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 transition-colors hover:border-white/50 hover:bg-white/10"
              >
                Seller sign in
              </Link>
            </div>

            <ul className="mt-7 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-center text-xs text-white/60 md:max-w-md md:text-left">
              <li><p className="text-xl font-extrabold text-white tabular md:text-2xl">0</p><p className="mt-0.5 leading-snug">Listing fee</p></li>
              <li><p className="text-xl font-extrabold text-white tabular md:text-2xl">48h</p><p className="mt-0.5 leading-snug">Delivery, handled</p></li>
              <li><p className="text-xl font-extrabold text-white tabular md:text-2xl">Weekly</p><p className="mt-0.5 leading-snug">Payouts</p></li>
            </ul>
          </div>

          {/* right: the perks card */}
          <div className="rise grid gap-3 sm:grid-cols-2">
            {PERKS.map((p, i) => (
              <article
                key={p.title}
                style={{ "--i": i } as React.CSSProperties}
                className="group flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/60 md:p-5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <p.icon className="size-5" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold">{p.title}</h3>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/60">{p.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* bottom: a long thin strip of product photos drifting across the width — very subtle, decorative */}
        <div aria-hidden className="mt-12 flex gap-3 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-3 md:mt-14">
          {["saree", "kurti", "jeans", "shirt", "jacket", "dress"].map((k, i) => (
            <span key={k + i} className="relative aspect-[3/4] w-[90px] shrink-0 overflow-hidden rounded-xl md:w-[110px]">
              <ProductImage photo={k as never} seed={`sell-${k}-${i}`} rounded={false} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
