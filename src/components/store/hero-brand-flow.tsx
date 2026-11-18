"use client";

import Image from "next/image";

/**
 * Freestanding 3D Illuminated Brand Showcase
 * Designed specifically for Hero Slide 1:
 * - Freestanding ManaBrand emblem with luminous Majestic Pink back-glow
 * - No bounding cards or boxes - pure, high-end, iconic brand emblem
 * - Synchronized floor shadow reflection and ambient light waves
 * - Optimized with z-index to never occlude or clip foreground typography
 */
export function HeroBrandFlow({ active }: { active: boolean }) {
  return (
    <div
      className="absolute inset-0 size-full overflow-hidden select-none -z-20 bg-[#06070a]"
      aria-hidden="true"
    >
      {/* Deep Obsidian & Majestic Pink Aurora Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_78%_42%,rgba(224,36,122,0.22)_0%,rgba(14,16,22,0.65)_50%,#06070a_100%)]" />

      {/* Subtle Luxury Mesh Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient Pulsing Glow Orbs */}
      <div className="pointer-events-none absolute right-[18%] top-[25%] size-80 rounded-full bg-[radial-gradient(circle,rgba(224,36,122,0.28)_0%,transparent_70%)] blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute right-[5%] bottom-[15%] size-96 rounded-full bg-[radial-gradient(circle,rgba(255,42,133,0.15)_0%,transparent_70%)] blur-3xl animate-pulse" />

      {/* Desktop Freestanding 3D Brand Emblem (Right side of hero) */}
      <div className="pointer-events-none absolute right-[5%] top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center justify-center w-[460px] xl:w-[540px]">
        {/* Soft Orbital Light Rings */}
        <div className="absolute size-[420px] xl:size-[480px] rounded-full border border-[rgb(224_36_122/0.25)] animate-[spin_40s_linear_infinite]" />
        <div className="absolute size-[500px] xl:size-[560px] rounded-full border border-dashed border-white/10 animate-[spin_60s_linear_infinite_reverse]" />

        {/* Freestanding Levitating Logo */}
        <div className="relative z-10 flex flex-col items-center hero-logo-levitate">
          <div className="relative">
            {/* Luminous backlight aura */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(224,36,122,0.45)_0%,transparent_70%)] blur-2xl scale-125" />
            <Image
              src="/logo.png"
              alt="ManaBrand"
              width={1122}
              height={1402}
              priority={active}
              className="relative z-10 h-80 xl:h-96 w-auto object-contain filter drop-shadow-[0_16px_40px_rgba(224,36,122,0.45)]"
            />
          </div>
          {/* Subtle floor shadow reflection */}
          <div className="mt-8 h-3 w-56 xl:w-72 rounded-full bg-[radial-gradient(ellipse,rgba(224,36,122,0.55)_0%,transparent_75%)] blur-md" />
        </div>
      </div>

      {/* Mobile Subtle Ambient Watermark (Behind text for rich brand presence) */}
      <div className="pointer-events-none absolute inset-0 flex lg:hidden items-center justify-center opacity-20 -translate-y-6">
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

      {/* Dark Vignettes to guarantee text contrast */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent lg:w-3/5" />
    </div>
  );
}
