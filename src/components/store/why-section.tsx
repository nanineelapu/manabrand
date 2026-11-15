import { Clock, ShieldCheck, Truck } from "lucide-react";
import { LogoImage } from "@/components/brand/logo";
import { Reveal } from "@/components/ui/motion";

/**
 * "Why ManaBrand" band — a light section between the black hero and the shop, in the reference's style:
 * wide-tracked eyebrow, giant black + red-italic title, three numbered rounded cards.
 * Copy matches the FAQ / shipping policy (delivery within 48 hours, COD, ₹1,499 free-shipping line).
 */
const CARDS = [
  { n: "001", icon: ShieldCheck, label: "1,200+ KYC-verified makers", title: ["Verified", "Sellers"], text: "Every maker is identity-checked and quality-reviewed before they list a single product — real people, real stock." },
  { n: "002", icon: Clock, label: "Delivered within 48 hours", title: ["Lightning", "Delivery"], text: "Orders are packed and delivered within 48 hours, with live tracking from the moment you order." },
  { n: "003", icon: Truck, label: "Free above ₹1,499", title: ["Free", "Shipping"], text: "Free shipping on orders above ₹1,499, and cash on delivery if you prefer to pay at your door." },
] as const;

export function WhySection() {
  return (
    <section aria-labelledby="why-h" data-round className="bg-white text-black">
      <div className="container-page py-12 md:py-14">
        <Reveal className="text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.55em] text-black sm:text-xs">Why ManaBrand</p>
          <h2 id="why-h" className="mt-3 flex items-center justify-center gap-3 text-[24px] font-black uppercase leading-none tracking-[-0.03em] text-black sm:text-3xl lg:text-[40px]">
            <span>Beyond the <span className="text-primary">Product</span></span>
            <span aria-hidden className="shrink-0"><LogoImage size="xs" className="h-9 lg:h-11" /></span>
          </h2>
        </Reveal>

        <div className="mt-7 grid gap-4 md:mt-9 md:grid-cols-3 md:gap-5">
          {CARDS.map((c, i) => (
            <Reveal key={c.n} delay={i * 90} className="group">
              <article className="flex h-full flex-col rounded-[26px] border border-black/10 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary md:rounded-[32px] md:p-6">
                <div className="flex items-start justify-between">
                  <span className="grid size-14 place-items-center rounded-[20px] bg-black text-white transition-colors duration-300 group-hover:bg-primary md:size-16 md:rounded-[22px]">
                    <c.icon className="size-6 md:size-7" strokeWidth={1.8} />
                  </span>
                  <span className="font-mono text-sm tracking-widest text-black/30">{c.n}</span>
                </div>

                <p className="mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-primary/80 md:mt-7 md:text-[11px]">{c.label}</p>
                <h3 className="mt-2 text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-black md:text-[30px]">
                  {c.title[0]}<br /><span className="text-black/30">{c.title[1]}</span>
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/60">{c.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
