"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const WHATSAPP_PHONE = "918317658309";
const DISPLAY_PHONE = "+91 831 765 8309";
const DEFAULT_MESSAGE = "Hi ManaBrand! I am browsing your store and need some assistance.";

export function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);
  const pathname = usePathname();
  // on phones the bag / checkout screens have their own sticky bar and amounts on the right edge, so stay out of the way
  const hideOnPhone = /^\/(cart|checkout)/.test(pathname);

  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <aside
      data-round
      aria-label="WhatsApp Support"
      className={cn("fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+4.75rem)] right-4 z-40 flex items-center gap-2.5 lg:bottom-6 lg:right-6", hideOnPhone && "max-lg:hidden")}
    >
      {/* Floating Chat Pill on Desktop / Mobile */}
      {showTooltip && (
        <div
          role="status"
          aria-live="polite"
          className="group relative hidden items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3.5 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all sm:flex"
        >
          <span className="relative flex size-2">
            <span className="relative inline-flex size-2 rounded-full bg-[#25D366]" />
          </span>
          <span className="text-xs font-semibold text-neutral-800">
            Chat on WhatsApp
          </span>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            aria-label="Close message"
            className="ml-0.5 text-neutral-400 hover:text-neutral-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Floating WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ManaBrand support on WhatsApp at ${DISPLAY_PHONE}`}
        className={cn(
          "group relative flex size-13 items-center justify-center rounded-full bg-[#25D366] text-white",
          "shadow-[0_2px_8px_rgba(0,0,0,0.22)] transition-all duration-300",
          "hover:scale-105 hover:bg-[#20ba5a]",
          "active:scale-95 sm:size-14"
        )}
      >
        {/* WhatsApp Official Vector Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-7 sm:size-7.5 transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.21 8.21 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.06s.88 2.39 1 2.56c.12.17 1.73 2.64 4.19 3.7.59.25 1.04.41 1.4.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3" />
        </svg>
      </a>
    </aside>
  );
}
