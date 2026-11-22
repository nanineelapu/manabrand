"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock, Gift, Truck, X, Zap } from "lucide-react";
import { SectionHeader } from "@/components/ui/display";
import { Reveal } from "@/components/ui/motion";
import { clock, magicLabel, magicState, type DealBoxConfig } from "@/lib/magic-hours";
import { ProductRail } from "@/components/store/product-card";
import type { Product } from "@/types";

const perks = (label: string) => [
  { icon: Gift, title: "Daily magic-hour deal", desc: `A fresh members-only fashion deal box opens every day, ${label}.` },
  { icon: Truck, title: "Free delivery", desc: "No delivery fee on any order, all year." },
  { icon: Zap, title: "Early access", desc: "First look at new styles and festive drops." },
] as const;


/** Live status of the daily magic hours: "Live now · ends in …" or "Opens in …". Client-only so it never mismatches on hydration. */
function MagicClock({ cfg }: { cfg: DealBoxConfig }) {
  const [st, setSt] = useState<{ live: boolean; msLeft: number } | null>(null);
  useEffect(() => {
    const tick = () => setSt(magicState(cfg));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [cfg]);
  const MAGIC_LABEL = magicLabel(cfg);
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[22px] bg-black p-4 text-white sm:flex-row sm:items-center sm:gap-4 md:p-5" role="timer" aria-live="off">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10"><Clock className="size-[22px]" strokeWidth={1.8} /></span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-white/60">
          {st?.live && <span className="size-2 rounded-full bg-emerald-400" />}
          {st?.live ? "Magic hours are on" : "Magic hours"} <span className="whitespace-nowrap">· {MAGIC_LABEL}</span>
        </p>
        <p className="mt-0.5 text-[13px] text-white/75">{st ? (st.live ? "Today’s deal box is open — ends in" : "Next deal box opens in") : "Every day, for a limited time"}</p>
      </div>
            </div>
      <p className="w-full rounded-xl bg-white/10 py-2 text-center text-[32px] font-black tabular-nums leading-none tracking-tight sm:w-auto sm:shrink-0 sm:bg-transparent sm:py-0 sm:text-2xl md:text-3xl">{st ? clock(st.msLeft) : "--:--:--"}</p>
    </div>
  );
}

/** Members-only pass: white section, three short perks, one pricing card. */
export function ManaDealBox({ config, picks = [] }: { config: DealBoxConfig; picks?: Product[] }) {
  const label = magicLabel(config);
  const PASS = { price: config.price, unit: "year" } as const;
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);
  const p = PASS;
  if (!config.enabled) return null; // (after the hooks, so their order never changes)

  return (
    <section aria-labelledby="dealbox-heading" data-round className="bg-white text-black">
      <div className="container-page py-12 md:py-16">
        <Reveal><SectionHeader id="dealbox-heading" eyebrow="Members only · Daily" title="Mana Deal Box" subtitle={`Opens every day in the magic hours, ${label}.`} /></Reveal>

        <div className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-5 md:mt-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-stretch lg:gap-8">
          {/* perks */}
          <div className="grid min-w-0 gap-3">
          <MagicClock cfg={config} />
          <ul className="grid min-w-0 gap-3">
            {perks(label).map((k, i) => (
              <li key={k.title}>
                <Reveal delay={i * 70}>
                  <div className="flex items-center gap-4 rounded-[22px] border border-black/10 bg-white p-4 transition-colors hover:border-primary md:p-5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-black text-white"><k.icon className="size-[22px]" strokeWidth={1.8} /></span>
                    <div className="min-w-0"><h3 className="text-[16px] font-extrabold tracking-tight">{k.title}</h3><p className="mt-0.5 text-[13px] leading-relaxed text-black/60">{k.desc}</p></div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          </div>

          {/* pass */}
          <Reveal delay={140}>
            <div className="flex h-full flex-col rounded-[28px] border border-black/10 bg-neutral-50 p-6 md:p-7">
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-black/50">Annual pass</p>

              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-5xl font-black tracking-tight tabular">₹{p.price}</span>
                <span className="text-sm font-medium text-black/50">/ {p.unit}</span>
              </p>
              <p className="mt-1 text-[13px] font-medium text-primary">That’s about ₹{Math.round(p.price / 12)} a month.</p>

              <ul className="mt-5 space-y-2 text-[14px] text-black/75">
                {[`Daily deal box, ${label}`, "Free delivery on every order", "Early access to limited drops"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5"><Check className="size-4 shrink-0 text-primary" strokeWidth={3} />{t}</li>
                ))}
              </ul>

              <div className="mt-7 lg:mt-auto lg:pt-7">
                <button type="button" onClick={() => { setDone(false); setOpen(true); }}
                  className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover">
                  Join the Deal Box <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="mt-2.5 text-center text-xs text-black/50">Cancel anytime.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {picks.length > 0 && (
        <div className="container-page pb-12 md:pb-16"><h3 className="mb-4 text-lg font-black tracking-tight">Today’s picks for members</h3><ProductRail products={picks} /></div>
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Join the Mana Deal Box" className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-sm rounded-[28px] bg-white p-6 text-black" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-black/[0.06] hover:bg-black/10"><X className="size-4" /></button>
            {!done ? (
              <form onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
                <h3 className="pr-10 text-xl font-black tracking-tight">Join the Mana Deal Box</h3>
                <p className="mt-1.5 text-sm text-black/60">Annual pass · ₹{p.price} / {p.unit}. Leave your mobile number or email and we’ll get in touch to start your pass.</p>
                <label htmlFor="dealbox-contact" className="mt-5 block text-[13px] font-semibold">Mobile number or email</label>
                <input id="dealbox-contact" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="98765 43210 or you@example.com"
                  className="mt-1.5 h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-[15px] outline-none placeholder:text-black/35 focus:border-primary" />
                <button type="submit" className="mt-5 h-12 w-full rounded-xl bg-primary text-[15px] font-bold text-white transition-colors hover:bg-primary-hover">Request my pass</button>
              </form>
            ) : (
              <div className="py-3 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-7" strokeWidth={3} /></span>
                <h3 className="mt-4 text-xl font-black tracking-tight">Thank you!</h3>
                <p className="mt-1.5 text-sm text-black/60">We’ll reach you at <b className="text-black">{contact}</b> to start your pass.</p>
                <button type="button" onClick={() => setOpen(false)} className="mt-6 h-11 w-full rounded-xl border border-black/15 text-sm font-bold hover:bg-black/5">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
