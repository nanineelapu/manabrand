"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Clock, Search, TrendingUp, X } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { useRecentSearches, useUi } from "@/lib/stores";
import { formatINR } from "@/lib/utils";
import { useStoreData } from "./store-data";

export function SearchOverlay({ trending }: { trending: string[] }) {
  const open = useUi((s) => s.searchOpen);
  const setOpen = useUi((s) => s.setSearch);
  const [q, setQ] = useState("");
  const router = useRouter();
  const { products } = useStoreData();
  const recent = useRecentSearches();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open, setOpen]);

  const matches = useMemo(() => {
    const t = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!t.length) return [];
    return products.filter((p) => { const hay = `${p.name} ${p.sub} ${p.category} ${p.sellerName}`.toLowerCase(); return t.every((w) => hay.includes(w)); }).slice(0, 5);
  }, [q, products]);

  if (!open) return null;

  const go = (term: string) => {
    const v = term.trim();
    if (!v) return;
    recent.add(v); setOpen(false); setQ(""); router.push(`/search?q=${encodeURIComponent(v)}`);
  };

  return (
    <div className="fixed inset-0 z-[80] animate-fade-in bg-bg" role="dialog" aria-modal="true" aria-label="Search">
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="flex items-center gap-2 border-b border-line px-4 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle" />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} type="search" enterKeyHint="search" autoComplete="off"
              placeholder="Search products, brands and sellers…" aria-label="Search products"
              className="h-12 w-full rounded-full border border-line-strong bg-card pl-11 pr-10 text-[15px] placeholder:text-subtle focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 [&::-webkit-search-cancel-button]:hidden" />
            {q && <button type="button" aria-label="Clear" onClick={() => { setQ(""); input.current?.focus(); }} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-bg-subtle"><X className="size-4" /></button>}
          </div>
          <button type="button" onClick={() => setOpen(false)} className="h-11 px-2 text-sm font-medium">Cancel</button>
        </form>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-5">
          {q.trim() ? (
            matches.length ? (
              <div>
                <ul className="divide-y divide-line">
                  {matches.map((p) => (
                    <li key={p.id}>
                      <Link href={`/product/${p.slug}`} onClick={() => { recent.add(q.trim()); setOpen(false); }} className="flex items-center gap-3 py-3">
                        <span className="size-14 shrink-0 overflow-hidden rounded-xl"><ProductImage photo={p.photo} seed={p.id} color={p.colors[0].hex} src={p.image} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p.name}</span>
                          <span className="block text-xs text-muted">{p.sub} · {p.sellerName}</span>
                        </span>
                        <span className="text-sm font-semibold tabular">{formatINR(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button onClick={() => go(q)} className="mt-3 flex w-full items-center justify-between rounded-ctl bg-bg-subtle px-4 py-3.5 text-sm font-medium">
                  See all results for “{q.trim()}” <ArrowUpRight className="size-4" />
                </button>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted">No matches for “{q.trim()}”. Try “kurta”, “saree” or “sneakers”.</p>
            )
          ) : (
            <div className="space-y-8">
              {recent.items.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold"><Clock className="size-4 text-muted" /> Recent</h3>
                    <button onClick={recent.clear} className="text-xs text-muted underline">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">{recent.items.map((r) => <button key={r} onClick={() => go(r)} className="rounded-full border border-line-strong bg-card px-3.5 py-2 text-sm hover:bg-bg-subtle">{r}</button>)}</div>
                </section>
              )}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><TrendingUp className="size-4 text-accent" /> Trending now</h3>
                <div className="flex flex-wrap gap-2">{trending.map((t) => <button key={t} onClick={() => go(t)} className="rounded-full bg-accent-soft px-3.5 py-2 text-sm font-medium text-accent-soft-fg hover:brightness-95">{t}</button>)}</div>
              </section>
              <section>
                <h3 className="mb-3 text-sm font-semibold">Browse</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[["Men", "/men"], ["Women", "/women"], ["Footwear", "/category/footwear"]].map(([c, href]) => (
                    <Link key={c} href={href} onClick={() => setOpen(false)} className="rounded-ctl border border-line bg-card px-4 py-3.5 text-sm font-medium capitalize hover:bg-bg-subtle">{c}</Link>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
