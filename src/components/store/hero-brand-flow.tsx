"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Hero slide 1 — the ManaBrand logo on plain black, nothing else around it.
 *  - behind it, rows of small logos flow continuously across a tilted 3D plane
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
    <div className="absolute inset-0 -z-20 size-full select-none overflow-hidden bg-black" aria-hidden="true">
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
            {/* the logo */}
            <div className="hbf-float relative z-10">
              <Image src="/logo-dark.png" alt="" width={819} height={1024} priority={active} quality={90} sizes="(min-width:1024px) 420px, 240px"
                className="h-[min(166px,18.5svh)] w-auto object-contain sm:h-[min(224px,22svh)] lg:h-[min(330px,42svh)] xl:h-[min(376px,46svh)]" />
            </div>
          </div>
        </div>
      </div>

      {/* legibility: text side darkens, bottom blends into the controls */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent max-lg:hidden lg:w-[62%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent lg:via-transparent" />
    </div>
  );
}
