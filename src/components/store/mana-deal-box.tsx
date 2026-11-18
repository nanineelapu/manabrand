"use client";

import { useState } from "react";
import { Check, Sparkles, Zap, Gift, ShieldCheck, Crown, ArrowRight, X, HeartHandshake } from "lucide-react";
import { Reveal } from "@/components/ui/motion";

export function ManaDealBox() {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
  const [modalOpen, setModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const perks = [
    {
      icon: Gift,
      title: "Weekly Mystery Deal Box",
      desc: "Curated local favourites, snacks, fashion, and gourmet essentials delivered to your doorstep at up to 60% off retail price.",
    },
    {
      icon: Zap,
      title: "Unlimited Free Express Delivery",
      desc: "Zero delivery fees on all orders across Ichapuram with lightning-fast 24h-48h dispatch — absolutely no minimum purchase required.",
    },
    {
      icon: Crown,
      title: "VIP Flash Sale Headstart",
      desc: "Get 2 hours of early priority access to limited festive drops, seasonal promotions, and high-demand seller inventory.",
    },
    {
      icon: ShieldCheck,
      title: "Guaranteed Lowest Local Prices",
      desc: "Members-only locked pricing directly from verified town merchants. Save an estimated ₹1,800+ every single month.",
    },
  ];

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <section
      aria-labelledby="dealbox-heading"
      data-round
      className="relative isolate overflow-hidden bg-[#07080c] py-14 text-white md:py-20"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-20 top-1/4 size-96 rounded-full bg-[radial-gradient(circle,rgba(224,36,122,0.18)_0%,transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 size-96 rounded-full bg-[radial-gradient(circle,rgba(255,42,133,0.15)_0%,transparent_70%)] blur-3xl" />
      
      {/* Geometric background mesh */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="container-page relative z-10">
        {/* Section Header */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff2a85]/30 bg-[#ff2a85]/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-[#ff6ea7] uppercase backdrop-blur-md">
            <Sparkles className="size-3.5 text-[#ff2a85]" />
            Mana Deal Club • Exclusive Membership
          </div>
          <h2
            id="dealbox-heading"
            className="mt-4 text-[28px] font-black tracking-[-0.03em] sm:text-4xl lg:text-[46px] leading-[1.1]"
          >
            Unlock the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff2a85] via-[#ff6ea7] to-white">Mana Deal Box</span>
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-white/70 sm:text-[16px] md:text-lg">
            Join the inner circle of Ichapuram shoppers. Claim weekly surprise deal boxes, wholesale pricing from local makers, and unlimited free express shipping.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-7 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                billing === "monthly"
                  ? "bg-[#ff2a85] text-white shadow-[0_0_20px_rgba(255,42,133,0.5)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Monthly Pass
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`relative rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                billing === "annual"
                  ? "bg-[#ff2a85] text-white shadow-[0_0_20px_rgba(255,42,133,0.5)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Annual Pass
              <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30">
                SAVE 44%
              </span>
            </button>
          </div>
        </Reveal>

        {/* Content Layout */}
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Perks List (7 cols) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {perks.map((p, idx) => (
              <Reveal key={p.title} delay={idx * 75}>
                <div className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#ff2a85]/50 hover:bg-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#ff2a85]/20 to-black text-[#ff2a85] border border-[#ff2a85]/30 group-hover:scale-105 transition-transform">
                      <p.icon className="size-5" />
                    </span>
                    <span className="font-mono text-[11px] font-bold text-white/30">
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[16px] font-extrabold text-white group-hover:text-[#ff6ea7] transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                    {p.desc}
                  </p>
                </div>
              </Reveal>
            ))}

            {/* Social Proof Pill */}
            <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <HeartHandshake className="size-4" />
                </span>
                <span className="font-medium text-white/80">
                  <strong className="text-emerald-400 font-bold">850+ local families</strong> in Ichapuram already subscribe to the Deal Club.
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Verified Community
              </span>
            </div>
          </div>

          {/* Right Column: Pricing & Purchase Card (5 cols) */}
          <div className="lg:col-span-5">
            <Reveal delay={200}>
              <div className="relative rounded-[28px] border-2 border-[#ff2a85]/40 bg-gradient-to-b from-[#16121d] via-[#0d0f17] to-[#07080c] p-7 md:p-8 shadow-[0_20px_50px_rgba(255,42,133,0.18)]">
                {/* Popular Badge */}
                <div className="absolute -top-3.5 right-7 rounded-full bg-gradient-to-r from-[#ff2a85] to-[#e0247a] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                  {billing === "annual" ? "Most Popular Plan" : "Flexible Pass"}
                </div>

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff6ea7]">
                  <Crown className="size-4 text-[#ff2a85]" />
                  VIP Membership Card
                </div>

                <h3 className="mt-2 text-2xl font-black text-white">
                  Mana Deal Box Pass
                </h3>

                {/* Price Display */}
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-white md:text-5xl">
                    ₹{billing === "annual" ? "999" : "149"}
                  </span>
                  <span className="text-sm font-medium text-white/50">
                    /{billing === "annual" ? "year" : "month"}
                  </span>
                  {billing === "annual" && (
                    <span className="ml-auto text-xs font-bold text-emerald-400">
                      ₹83 / mo billed yearly
                    </span>
                  )}
                </div>

                {/* What's Included */}
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                    What you get right away:
                  </p>
                  <ul className="mt-3 space-y-2.5 text-xs sm:text-[13px] text-white/80">
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#ff2a85]" />
                      <span>Free Welcome Surprise Gift Box (worth ₹599)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#ff2a85]" />
                      <span>Unlimited Free Express Delivery all year</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#ff2a85]" />
                      <span>Weekly Friday Deal Box drops at wholesale prices</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#ff2a85]" />
                      <span>Dedicated priority WhatsApp assistance</span>
                    </li>
                  </ul>
                </div>

                {/* Buy Membership Button */}
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={() => {
                      setSubscribed(false);
                      setModalOpen(true);
                    }}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff2a85] to-[#e0247a] px-6 py-4 text-[15px] font-bold text-white shadow-[0_8px_25px_rgba(255,42,133,0.35)] transition-all hover:brightness-110 hover:shadow-[0_12px_32px_rgba(255,42,133,0.5)]"
                  >
                    <span>Get Mana Deal Box</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="mt-2.5 text-center text-[11px] text-white/50">
                    Cancel anytime in 1 click • Instant digital activation
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Interactive Modal (Dummy Frontend Flow) */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0f1118] p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>

            {!subscribed ? (
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#ff2a85]/10 px-3 py-1 text-[11px] font-bold text-[#ff6ea7]">
                  <Crown className="size-3.5 text-[#ff2a85]" />
                  Early Access Pass
                </div>
                <h3 className="mt-3 text-xl font-black">
                  Join the Mana Deal Club
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-white/70">
                  Enter your mobile number or email to lock in your early-bird membership rate (
                  {billing === "annual" ? "₹999/yr" : "₹149/mo"}).
                </p>

                <form onSubmit={handleJoin} className="mt-5 space-y-3">
                  <div>
                    <label htmlFor="member-contact" className="block text-xs font-semibold text-white/80">
                      Mobile number or Email
                    </label>
                    <input
                      id="member-contact"
                      type="text"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="+91 98765 43210 or yourname@gmail.com"
                      className="mt-1.5 w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-[#ff2a85] focus:outline-none focus:ring-1 focus:ring-[#ff2a85]"
                    />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70">
                    <p className="font-semibold text-white">Selected Plan: {billing === "annual" ? "Annual Pass (₹999/yr)" : "Monthly Pass (₹149/mo)"}</p>
                    <p className="mt-0.5 text-[11px] text-white/50">Instant activation with your phone number upon checkout rollout.</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-[#ff2a85] to-[#e0247a] py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                  >
                    Confirm & Reserve Membership
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="size-7" />
                </div>
                <h3 className="mt-4 text-xl font-black text-white">
                  Reservation Confirmed!
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-white/70">
                  You are now on the VIP priority whitelist for the{" "}
                  <strong className="text-[#ff6ea7]">Mana Deal Box</strong>. We will notify you at{" "}
                  <span className="font-semibold text-white">{emailInput || "your contact"}</span> as soon as payment activation begins!
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mt-6 w-full rounded-xl border border-white/20 bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/15"
                >
                  Close & Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
