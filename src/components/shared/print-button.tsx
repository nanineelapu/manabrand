"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/** "Print / Save as PDF" button for the print pages (hidden when printing). `auto` opens the print dialog on load. */
export function PrintButton({ auto }: { auto?: boolean }) {
  useEffect(() => { if (auto) { const t = setTimeout(() => window.print(), 600); return () => clearTimeout(t); } }, [auto]);
  return (
    <button type="button" onClick={() => window.print()} className="print:hidden inline-flex h-10 items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white">
      <Printer className="size-4" /> Print / Save as PDF
    </button>
  );
}
