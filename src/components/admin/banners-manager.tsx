"use client";

import { useState } from "react";
import { Calendar, Pencil } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { saveBanner, setBannerStatus } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { formatDate } from "@/lib/utils";
import type { Banner } from "@/types";

const placement = { "home-hero": "Home hero", "home-strip": "Home strip", category: "Category page" };

export function BannersManager({ banners }: { banners: Banner[] }) {
  const [list, setList] = useState(banners);
  const [edit, setEdit] = useState<Banner | null>(null);
  const [err, setErr] = useState("");
  const { act } = useAct();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((b) => (
          <article key={b.id} className="overflow-hidden rounded-card border border-line bg-card shadow-card">
            <div className="relative flex aspect-[16/8] items-center px-5" style={{ background: `linear-gradient(120deg, ${b.tone[0]}, ${b.tone[1]}66)` }}>
              <div className="relative z-10 max-w-[58%]"><p className="font-display text-xl font-semibold leading-tight">{b.title}</p><p className="mt-1 line-clamp-2 text-xs text-fg/70">{b.subtitle}</p><span className="mt-2 inline-block rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white">{b.cta}</span></div>
              <div className="absolute inset-y-3 right-4 aspect-[3/4] rotate-3 overflow-hidden rounded-xl shadow-pop"><ProductImage photo={b.photo} color={b.tone[1]} /></div>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-medium">{placement[b.placement]}</span><StatusBadge status={b.status} /></div>
              <p className="flex items-center gap-1.5 text-[13px] text-muted"><Calendar className="size-3.5" />{formatDate(b.starts, { day: "numeric", month: "short" })} → {formatDate(b.ends, { day: "numeric", month: "short", year: "numeric" })}</p>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <Button size="sm" variant="outline" onClick={() => setEdit(b)}><Pencil className="size-3.5" /> Edit</Button>
                <label className="flex items-center gap-2 text-sm text-muted">{b.status === "live" ? "Live" : "Off"}<Switch label={`${b.title} live`} checked={b.status === "live"} onChange={(v) => act(() => setBannerStatus(b.id, v ? "live" : "draft"), { success: v ? "Banner is live on the storefront" : "Banner unpublished", refresh: false, onOk: () => setList((l) => l.map((x) => (x.id === b.id ? { ...x, status: v ? "live" : "draft" } : x))) })} /></label>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Sheet open={!!edit} onClose={() => { setEdit(null); setErr(""); }} side="dialog" title="Edit banner"
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={() => { if (!edit?.title.trim()) { setErr("Headline is required"); return; } act(() => saveBanner({ id: edit.id, title: edit.title, subtitle: edit.subtitle, cta: edit.cta, href: edit.href, starts: edit.starts, ends: edit.ends }), { success: "Banner saved", refresh: false, onOk: () => { setList((l) => l.map((x) => (x.id === edit.id ? edit : x))); setEdit(null); } }); }}>Save banner</Button></div>}>
        {edit && <div className="space-y-4">
          <Field label="Headline" htmlFor="bt" error={err}><Input id="bt" value={edit.title} onChange={(e) => { setEdit({ ...edit, title: e.target.value }); setErr(""); }} invalid={!!err} /></Field>
          <Field label="Sub-headline" htmlFor="bs"><Input id="bs" value={edit.subtitle} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Button text" htmlFor="bc"><Input id="bc" value={edit.cta} onChange={(e) => setEdit({ ...edit, cta: e.target.value })} /></Field><Field label="Link" htmlFor="bh"><Input id="bh" value={edit.href} onChange={(e) => setEdit({ ...edit, href: e.target.value })} /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Starts" htmlFor="b1"><Input id="b1" type="date" value={edit.starts} onChange={(e) => setEdit({ ...edit, starts: e.target.value })} /></Field><Field label="Ends" htmlFor="b2"><Input id="b2" type="date" value={edit.ends} onChange={(e) => setEdit({ ...edit, ends: e.target.value })} /></Field></div>
        </div>}
      </Sheet>
    </>
  );
}
