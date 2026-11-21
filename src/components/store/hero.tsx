"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { HeroBrandFlow } from "@/components/store/hero-brand-flow";
import type { CmsHome, CmsSite, HeroSlide } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

export type HeroSlideData = HeroSlide;

/** Bright stock photos (Unsplash) used when a slide has no uploaded photo — matched to the slide's category. */
const STOCK: Record<string, string> = {
  women: "1609357605129-26f69add5d6e", // teal dress, flowing
  men: "1488161628813-04466f872be2",   // street style: jacket, orange trousers
};
const DEFAULT_STOCK = "1488161628813-04466f872be2"; // men's street style (desktop): jacket, orange trousers
const WIDTHS = [640, 1024, 1536, 2200] as const;
const urlAt = (s: HeroSlide, w: number) => (s.image ? `${s.image}?w=${w}&auto=format&q=75` : `https://images.unsplash.com/photo-${STOCK[s.category ?? ""] ?? DEFAULT_STOCK}?auto=format&fit=crop&crop=entropy&w=${w}&h=${Math.round(w * 0.66)}&q=70`);
/** src + srcSet so every screen downloads only the size it needs. */
const photoProps = (s: HeroSlide) => ({ src: urlAt(s, 1024), srcSet: WIDTHS.map((w) => `${urlAt(s, w)} ${w}w`).join(", "), sizes: "100vw" });

/** White headline; the optional "special word(s)" are set in vivid Majestic Pink. */
function Headline({ text, emphasis, plain }: { text: string; emphasis?: string; plain?: boolean }) {
  return text.split(/\r?\n/).map((line, i) => {
    const at = emphasis ? line.indexOf(emphasis) : -1;
    return <span key={i} className="block">{at < 0 ? line : <>{line.slice(0, at)}<span className={plain ? "font-black text-white" : "text-[#ff2a85] font-black"}>{emphasis}</span>{line.slice(at + emphasis!.length)}</>}</span>;
  });
}

/** Sub-headline with one phrase picked out in bold vivid Majestic Pink. */
function Subtitle({ text, highlight, plain }: { text: string; highlight?: string; plain?: boolean }) {
  const at = highlight ? text.indexOf(highlight) : -1;
  if (at < 0) return <>{text}</>;
  return <>{text.slice(0, at)}<span className={plain ? "font-bold text-white" : "font-bold text-[#ff2a85]"}>{highlight}</span>{text.slice(at + highlight!.length)}</>;
}

/** On phones a "Browse …" label drops the verb ("Browse collections" → "Collections") so it fits on one line. */
function CtaLabel({ label }: { label: string }) {
  const m = /^(browse)\s+(.+)$/i.exec(label);
  if (!m) return <>{label}</>;
  return <><span className="hidden sm:inline">{m[1]} </span><span className="inline-block first-letter:uppercase sm:first-letter:normal-case">{m[2]}</span></>;
}

const AUTOPLAY_MS = 7000;

/**
 * Home hero — deliberately simple: a full-width photo, a headline, one line of text and the two buttons.
 * 110% of the screen tall; the text and buttons sit inside the first screen. The client adds more slides in Sanity
 * (Home page → Hero slides); the buttons and dots are fixed while the photos change behind them.
 */
export function Hero({ c, slides, site }: {
  c: Pick<CmsHome, "primaryCta" | "secondaryCta">; slides: HeroSlideData[];
  site: Pick<CmsSite, "announcementEnabled" | "announcements">;
}) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setI((v) => (v + 1) % n), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null; if (!s) return;
    const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? i + 1 : i - 1);
  };

  return (
    <section aria-label="Featured" aria-roledescription="carousel" data-theme="dark" data-round
      className="relative isolate -mt-[68px] flex h-[calc(100svh-var(--tabbar-h))] flex-col overflow-hidden bg-black text-white lg:-mt-[80px] lg:h-[110svh]">
      <div className="relative flex flex-1 overflow-hidden"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}>
        <div className="flex w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.2,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((s, k) => {
            const active = k === i;
            const Title = k === 0 ? "h1" : "h2";
            return (
              <div key={k} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`} aria-hidden={!active} inert={!active} className="relative flex w-full shrink-0 flex-col overflow-hidden">
                {k === 0 ? (
                  /* Slide 1: Highlighting the ManaBrand logo with continuous 3D flow animation */
                  <HeroBrandFlow active={active} />
                ) : (
                  <>
                    <div className="absolute inset-0 -z-20">
                      <picture>
                        {s.mobileImage && <source media="(max-width: 767px)" srcSet={s.mobileImage} />}
                        <img {...photoProps(s)} alt="" decoding="async" className="size-full object-cover brightness-110 saturate-110" fetchPriority="auto" loading="lazy" />
                      </picture>
                    </div>
                    <div aria-hidden className="absolute inset-0 -z-10 bg-black/35" />
                  </>
                )}

                {/* first screen: the message, vertically centred between the header and the buttons */}
                <div className={cn("flex flex-1 lg:h-[100svh] lg:flex-none", k === 0 ? "items-end lg:items-center" : "items-center max-md:items-end")}>
                  <div className={cn("container-page w-full pb-[clamp(176px,24svh,220px)] pt-[clamp(84px,13svh,128px)] lg:pb-[clamp(110px,15svh,150px)] lg:pt-[clamp(96px,14svh,140px)]", k === 0 ? "max-lg:pb-[clamp(168px,22svh,200px)]" : "max-md:pb-[clamp(168px,22svh,200px)]")}>
                    <div className={cn("flex max-w-3xl flex-col items-start gap-[clamp(12px,2.2svh,20px)]", active && "stagger")}>
                      <Title style={{ "--i": 0 } as React.CSSProperties} className={cn("font-black tracking-[-0.04em] text-white",
                        k === 0
                          ? "text-[clamp(27px,4.4svh,34px)] leading-[1.12] sm:text-[clamp(34px,6svh,48px)] lg:text-[clamp(40px,min(4.1vw,8.2svh),60px)] lg:leading-[1.06]"
                          : "text-[clamp(34px,6svh,44px)] leading-[1.08] sm:text-[clamp(42px,8svh,58px)] lg:text-[clamp(44px,min(4.8vw,9svh),72px)]")}>
                        <Headline text={s.headline} emphasis={s.headlineEmphasis} plain={k === 0} />
                      </Title>
                      <p style={{ "--i": 1 } as React.CSSProperties} className="max-w-xl text-[clamp(15px,2.3svh,17px)] leading-relaxed text-white/90 md:text-[clamp(16px,2.5svh,19px)]">
                        <span className={s.subtitleShort ? "hidden sm:inline" : undefined}><Subtitle text={s.subtitle} highlight={s.subtitleHighlight} plain={k === 0} /></span>
                        {s.subtitleShort && <span className="sm:hidden"><Subtitle text={s.subtitleShort} highlight={s.subtitleHighlight} plain={k === 0} /></span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* fixed layer (inside the first screen): the two buttons + dots */}
        <div className="pointer-events-none absolute inset-x-0 top-[calc(100svh-var(--tabbar-h)-11.75rem)] z-10 lg:top-[calc(100svh-6.5rem)]">
          <div className="container-page">
            <div className="flex flex-col-reverse gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="pointer-events-auto flex w-full gap-3 sm:w-auto sm:gap-4">
                <Link href={c.primaryCta.href} className={cn("inline-flex h-12 flex-1 items-center justify-center rounded-2xl px-5 text-[15px] font-bold transition-colors sm:h-14 sm:flex-none sm:px-9 sm:text-[16px]", i === 0 ? "bg-white text-black hover:bg-white/85" : "bg-primary text-white hover:bg-primary-hover")}>
                  {c.primaryCta.label}
                </Link>
                <Link href={c.secondaryCta.href} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-white/80 bg-black/20 px-4 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black sm:h-14 sm:flex-none sm:gap-3 sm:px-9 sm:text-[16px]">
                  <CtaLabel label={c.secondaryCta.label} /> <ArrowRight className="size-5" />
                </Link>
              </div>

              {n > 1 && (
                <div className="pointer-events-auto flex w-fit items-center rounded-full bg-black/35 px-1.5 backdrop-blur-sm" role="tablist" aria-label="Choose slide">
                  {slides.map((_, k) => (
                    <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} className="group px-1.5 py-3">
                      <span className={cn("block h-1.5 rounded-full transition-all duration-500", k === i ? "w-9 bg-white" : "w-1.5 bg-white/50 group-hover:bg-white/80")} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnnouncementBar site={site} />
    </section>
  );
}
