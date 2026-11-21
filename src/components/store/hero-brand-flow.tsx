"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Hero slide 1 — the ManaBrand logo is the hero.
 *  - a luminous glass disc holds the logo, so its red mark pops instead of drowning in a dark glow
 *  - a slow rotating pink light ring, a few orbiting sparks and a soft floor reflection
 *  - behind everything, rows of small logos flow continuously across a tilted 3D plane
 *  - on desktop the stage leans gently towards the pointer (skipped for reduced motion)
 * Everything is decorative (aria-hidden) and sits behind the headline, so text contrast is never affected.
 */
const ROW_DIRS = ["hbf-row-a", "hbf-row-b", "hbf-row-a", "hbf-row-b", "hbf-row-a", "hbf-row-b"];

export function HeroBrandFlow({ active }: { active: boolean }) {
  const tilt = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tilt.current;
    if (!el || !active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, [active]);

  return (
    <div className="absolute inset-0 -z-20 size-full select-none overflow-hidden bg-[#07060a]" aria-hidden="true">
      {/* aurora: pink on the logo side, a cool violet counter-light bottom-left */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_74%_46%,rgba(224,36,122,0.30),transparent_62%),radial-gradient(50%_60%_at_8%_105%,rgba(98,64,255,0.22),transparent_60%)]" />

      {/* continuous flow of logos across a tilted 3D plane */}
      <div className="hbf-plane absolute inset-0 opacity-[0.16] [mask-image:radial-gradient(70%_65%_at_62%_48%,#000_10%,transparent_78%)]">
        <div className="hbf-plane-inner">
          {ROW_DIRS.map((dir, r) => (
            <div key={r} className={`hbf-row ${dir}`} style={{ animationDuration: `${46 + r * 7}s`, marginLeft: r % 2 ? "-6rem" : 0 }}>
              {Array.from({ length: 24 }, (_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src="/logo-dark.png" alt="" width={46} height={58} loading="lazy" decoding="async" className="h-14 w-auto shrink-0 opacity-90" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* the stage */}
      <div className="pointer-events-none absolute left-1/2 top-[clamp(72px,9svh,100px)] -translate-x-1/2 lg:left-auto lg:right-[6%] lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0 xl:right-[8%]">
        <div ref={tilt} className="hbf-tilt relative grid place-items-center">
          <div className="relative grid size-[min(224px,25svh)] place-items-center sm:size-[min(300px,30svh)] lg:size-[min(440px,56svh)] xl:size-[min(500px,60svh)]">
            {/* rotating light ring */}
            <span className="hbf-ring absolute inset-[-10px] rounded-full" />
            {/* glass disc */}
            <span className="absolute inset-0 rounded-full border border-white/20 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.20),rgba(255,255,255,0.05)_58%,rgba(224,36,122,0.10))] shadow-[inset_0_0_60px_rgba(255,255,255,0.08),0_30px_90px_-20px_rgba(224,36,122,0.55)] backdrop-blur-[2px]" />
            {/* orbiting sparks */}
            <span className="hbf-orbit absolute inset-[-26px]" style={{ animationDuration: "22s" }}><i className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-[#ff5fb0] shadow-[0_0_14px_#ff5fb0]" /></span>
            <span className="hbf-orbit absolute inset-[-44px]" style={{ animationDuration: "34s", animationDirection: "reverse" }}><i className="absolute bottom-[12%] left-[6%] size-1.5 rounded-full bg-white shadow-[0_0_12px_white]" /></span>
            <span className="hbf-orbit absolute inset-[-8px]" style={{ animationDuration: "16s" }}><i className="absolute right-[10%] top-[16%] size-1.5 rounded-full bg-[#ffd0ea] shadow-[0_0_10px_#ff8cc8]" /></span>
            {/* the logo */}
            <div className="hbf-float relative z-10">
              <Image src="/logo-dark.png" alt="" width={819} height={1024} priority={active} quality={90} sizes="(min-width:1024px) 420px, 240px"
                className="h-[min(166px,18.5svh)] w-auto object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.45)] sm:h-[min(224px,22svh)] lg:h-[min(330px,42svh)] xl:h-[min(376px,46svh)]" />
            </div>
          </div>
          {/* floor reflection */}
          <span className="mt-7 hidden h-3 w-72 rounded-full bg-[radial-gradient(ellipse,rgba(224,36,122,0.65),transparent_72%)] blur-md lg:block" />
        </div>
      </div>

      {/* legibility: text side darkens, bottom blends into the controls */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent max-lg:hidden lg:w-[62%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent lg:via-transparent" />
    </div>
  );
}
