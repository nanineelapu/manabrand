"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./button";

/**
 * One overlay primitive, four behaviours:
 *  - "bottom": mobile-style bottom sheet at every size
 *  - "left" / "right": side drawers at every size
 *  - "auto":  bottom sheet < md, right drawer ≥ md   (filters, mini-cart)
 *  - "dialog": bottom sheet < md, centred modal ≥ md (confirmations, forms)
 */
type Side = "bottom" | "left" | "right" | "auto" | "dialog";

const panel: Record<Side, string> = {
  bottom: "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl animate-sheet-up",
  left: "inset-y-0 left-0 w-[86%] max-w-sm animate-sheet-left",
  right: "inset-y-0 right-0 w-[92%] max-w-md animate-sheet-right",
  auto: "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl animate-sheet-up md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:animate-sheet-right",
  dialog: "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl animate-sheet-up md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:animate-pop-in",
};

/** Exit animations (the mirror of `panel`): the sheet slides / fades back out before it unmounts. */
const exitAnim: Record<Side, string> = {
  bottom: "animate-sheet-down-out",
  left: "animate-sheet-left-out",
  right: "animate-sheet-right-out",
  auto: "animate-sheet-down-out md:animate-sheet-right-out",
  dialog: "animate-sheet-down-out md:animate-pop-out",
};
const EXIT_MS = 260;

export function Sheet({
  open, onClose, title, description, side = "auto", children, footer, className, hideHeader,
}: {
  open: boolean; onClose: () => void; title?: string; description?: string; side?: Side;
  children: React.ReactNode; footer?: React.ReactNode; className?: string; hideHeader?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // keep the sheet mounted while its exit animation plays (shown → closing → unmounted)
  const [shown, setShown] = useState(open);
  const [closing, setClosing] = useState(false);
  if (open && (!shown || closing)) { setShown(true); setClosing(false); }
  else if (!open && shown && !closing) setClosing(true);
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => { setShown(false); setClosing(false); }, EXIT_MS);
    return () => clearTimeout(t);
  }, [closing]);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lenis = (window as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    const el = ref.current;
    el?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab" || !el) return;
      const f = el.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      lenis?.start();
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  // Portal into the nearest surface wrapper so the sheet inherits admin/seller tokens.
  const [host, setHost] = useState<Element | null>(null);
  const marker = (
    <span hidden ref={(el) => { if (el && !host) setHost(el.closest("[data-surface]") ?? document.body); }} />
  );

  if (!shown || !host) return marker;

  return <>{marker}{createPortal(
    <div className={cn("fixed inset-0 z-[70]", closing && "pointer-events-none")}>
      <div className={cn("absolute inset-0 bg-ink/45 backdrop-blur-[2px]", closing ? "animate-fade-out" : "animate-fade-in")} onClick={onClose} aria-hidden />
      <div
        ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className={cn("absolute flex flex-col bg-panel text-fg shadow-pop outline-none", closing ? panel[side].replace(/(md:)?animate-[\w-]+/g, "") + " " + exitAnim[side] : panel[side], className)}
      >
        {side !== "left" && side !== "right" && (
          <div className="flex justify-center pt-2.5 md:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-line-strong" />
          </div>
        )}
        {!hideHeader && (
          <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3 md:pt-5">
            <div className="min-w-0">
              {title && <h2 className="font-display text-xl font-semibold leading-tight">{title}</h2>}
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <IconButton label="Close" size="sm" variant="secondary" onClick={onClose}><X className="size-[18px]" /></IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    host,
  )}</>;
}
