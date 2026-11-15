"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { SearchField } from "@/components/ui/form";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Reads initial ?q= and ?status= (set by dashboard links / global search) then manages local filter state. */
export function useListFilter(defaultTab = "all") {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [tab, setTab] = useState(sp.get("status") ?? defaultTab);
  return { q, setQ, tab, setTab };
}

export function ListToolbar({
  q, setQ, tab, setTab, tabs, placeholder, right, className,
}: {
  q: string; setQ: (v: string) => void; tab: string; setTab: (v: string) => void; tabs: TabItem[];
  placeholder: string; right?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("mb-4 space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField value={q} onChange={setQ} placeholder={placeholder} className="flex-1 sm:max-w-sm" />
        {right && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{right}</div>}
      </div>
      <Tabs variant="pill" size="sm" items={tabs} value={tab} onChange={setTab} />
    </div>
  );
}
