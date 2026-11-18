"use client";

import Image from "next/image";

/**
 * Luxury Hero Brand Stage
 * Designed for flagship luxury showcase on Slide 1:
 * - Deep obsidian stage with atmospheric Majestic Pink ambient lighting
 * - Monolithic 3D levitating brand emblem with soft orbital aura and specular reflection
 * - Clean, non-distracting, high-contrast aesthetic that elevates the typography and logo
 */
export function HeroBrandFlow({ active }: { active: boolean }) {
  return (
    <div
      className="absolute inset-0 size-full overflow-hidden select-none bg-[#050608]"
      aria-hidden="true"
    >
      {/* Ambient Majestic Pink & Obsidian light stage */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_75%_35%,rgba(224,36,122,0.18)_0%,rgba(10,12,18,0.7)_55%,#050608_100%)]" />

      {/* Subtle luxury geometric grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Soft floating atmospheric dust particles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[22%] top-[25%] size-72 rounded-full bg-[radial-gradient(circle,rgba(224,36,122,0.25)_0%,transparent_70%)] blur-3xl animate-pulse" />
        <div className="absolute right-[8%] top-[55%] size-80 rounded-full bg-[radial-gradient(circle,rgba(255,42,133,0.12)_0%,transparent_70%)] blur-3xl animate-pulse" />
      </div>

      {/* Desktop 3D Levitating Brand Showcase (Right side of hero) */}
      <div className="pointer-events-none absolute right-[4%] top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center justify-center w-[460px] h-[520px]">
        {/* Luxury Orbital Light Rings */}
        <div className="absolute size-[420px] rounded-full border border-[rgb(224_36_122/0.22)] animate-[spin_40s_linear_infinite]" />
        <div className="absolute size-[490px] rounded-full border border-dashed border-white/10 animate-[spin_60s_linear_infinite_reverse]" />
        <div className="absolute size-[340px] rounded-full border border-[rgb(255_42_133/0.18)]" />

        {/* Levitating Brand Emblem Pod */}
        <div className="relative z-10 flex flex-col items-center hero-logo-levitate">
          <div className="relative flex items-center justify-center p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="relative">
              {/* Backlight halo */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(224,36,122,0.45)_0%,transparent_75%)] blur-2xl scale-125" />
              <Image
                src="/logo.png"
                alt="ManaBrand"
                width={1122}
                height={1402}
                priority={active}
                className="relative z-10 h-72 w-auto object-contain filter drop-shadow-[0_12px_32px_rgba(224,36,122,0.4)]"
              />
            </div>
          </div>
          {/* Floor shadow reflection */}
          <div className="mt-6 h-3 w-56 rounded-full bg-[radial-gradient(ellipse,rgba(224,36,122,0.5)_0%,transparent_75%)] blur-md" />
        </div>
      </div>

      {/* Mobile Center Brand Glow (Subtle and behind text to ensure 100% legibility) */}
      <div className="pointer-events-none absolute inset-0 flex lg:hidden items-center justify-center opacity-25 -translate-y-10">
        <div className="relative size-72">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(224,36,122,0.4)_0%,transparent_70%)] blur-2xl animate-pulse" />
          <Image
            src="/logo.png"
            alt="ManaBrand"
            width={1122}
            height={1402}
            className="size-full object-contain filter drop-shadow-[0_0_35px_rgba(224,36,122,0.6)]"
          />
        </div>
      </div>

      {/* Depth vignette overlays for contrast */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent lg:w-3/5" />
    </div>
  );
}
