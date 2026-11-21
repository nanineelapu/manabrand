import Link from "next/link";
import { Phone, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import type { CmsSite } from "@/lib/cms/types";

/** The "_" between words, drawn as a short bar like the reference's terminal-style headline. */
const U = () => <span aria-hidden className="mx-[0.06em] inline-block h-[0.07em] w-[0.42em] bg-current align-baseline" />;

/**
 * Full-width call-to-action above the footer: a big black rounded card on a white band
 * (reference: good-cake-express "Secure the Signature Slice"). Rating, phone and "made in" come from site data.
 */
export function CtaBand({ site }: { site: Pick<CmsSite, "supportPhone" | "madeIn"> }) {
  return (
    <section aria-label="Start shopping" data-round className="bg-white py-8 md:py-10">
      <div className="container-page">
        <Reveal>
          <div data-theme="dark" className="relative grid overflow-hidden rounded-[28px] bg-black text-white md:rounded-[44px] lg:grid-cols-[1fr_300px] lg:rounded-[52px]">
            {/* soft red glow + right-edge fade */}
            <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-primary/25 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white/[0.07] to-transparent" />

            <div className="relative flex min-w-0 flex-col justify-center gap-8 p-6 sm:p-8 md:p-10 lg:gap-10 lg:p-10">
              <p className="text-[40px] font-black uppercase leading-[0.92] tracking-[-0.045em] sm:text-5xl md:text-6xl lg:text-[clamp(44px,4.8vw,68px)]">
                <span className="block text-white">Find<U />your</span>
                <span className="block text-accent">Next<U />look</span>
              </p>
            </div>

            <div className="relative flex flex-col justify-center gap-5 border-t border-white/10 p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-6">
              <div className="flex gap-2.5 lg:flex-col">
                <Link href="/shop" className="group flex min-h-14 flex-1 items-center justify-between gap-4 rounded-[22px] bg-white px-5 text-base font-black uppercase leading-tight tracking-tight text-primary transition-transform hover:-translate-y-0.5 lg:min-h-24 lg:text-xl">
                  <span>Start<br className="hidden lg:inline" /> shopping</span>
                  <ShoppingBag className="size-6 shrink-0 transition-transform group-hover:scale-110" strokeWidth={2} />
                </Link>
                {site.supportPhone ? (
                  <a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="group flex size-14 shrink-0 items-center justify-center gap-4 rounded-[22px] border-2 border-white/15 bg-white/[0.04] px-0 text-base font-black uppercase tracking-tight transition-colors hover:border-white/40 lg:size-auto lg:min-h-16 lg:w-full lg:justify-between lg:px-5 lg:text-lg" aria-label="Call support">
                    <span className="hidden lg:inline">Call_support</span>
                    <Phone className="size-5 shrink-0 text-white/70 transition-transform group-hover:rotate-12" strokeWidth={2} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
