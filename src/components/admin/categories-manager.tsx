"use client";

import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { addSubcategory, removeSubcategory, saveCategory } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import type { Category } from "@/types";

export function CategoriesManager({ categories, subs }: { categories: Category[]; subs: Record<string, string[]> }) {
  const [list, setList] = useState(categories);
  const [subMap, setSubMap] = useState(subs);
  const [edit, setEdit] = useState<{ id?: string; name: string; tagline: string } | null>(null);
  const [newSub, setNewSub] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  const { act } = useAct();

  const save = () => {
    if (!edit?.name.trim()) { setErr("Category name is required"); return; }
    const applyLocal = () => {
      if (edit.id) setList((l) => l.map((c) => (c.id === edit.id ? { ...c, name: edit.name, tagline: edit.tagline } : c)));
      else setList((l) => [...l, { id: `c${Date.now()}`, slug: edit.name.toLowerCase().replace(/\s+/g, "-"), name: edit.name, tagline: edit.tagline, tone: ["#f3ead9", "#dcc79e"], photo: "decor", productCount: 0 }]);
      setEdit(null); setErr("");
    };
    act(() => saveCategory({ id: edit.id, name: edit.name, tagline: edit.tagline }), { success: "Category saved", onOk: applyLocal, refresh: true });
  };

  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => setEdit({ name: "", tagline: "" })}><Plus className="size-4" /> Add category</Button></div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {list.map((c) => (
          <article key={c.id} className="rounded-card border border-line bg-card p-4 shadow-card md:p-5">
            <div className="flex items-center gap-4">
              <span className="aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg"><ProductImage photo={c.photo} color={c.tone[1]} /></span>
              <div className="min-w-0 flex-1"><h3 className="text-base font-semibold">{c.name}</h3><p className="truncate text-[13px] text-muted">{c.tagline}</p><p className="mt-1 text-xs font-medium tabular">{c.productCount} live products</p></div>
              <Button size="sm" variant="outline" onClick={() => setEdit({ id: c.id, name: c.name, tagline: c.tagline })}><Pencil className="size-3.5" /> Edit</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {(subMap[c.slug] ?? []).map((s) => <span key={s} className="inline-flex h-8 items-center gap-1 rounded-full bg-bg-subtle pl-3 pr-1 text-[13px]">{s}<button aria-label={`Remove ${s}`} onClick={() => act(() => removeSubcategory(c.id, s), { success: `${s} removed`, refresh: false, onOk: () => setSubMap((m) => ({ ...m, [c.slug]: m[c.slug].filter((x) => x !== s) })) })} className="grid size-6 place-items-center rounded-full hover:bg-line"><X className="size-3" /></button></span>)}
              <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const v = newSub[c.slug]?.trim(); if (!v) return; act(() => addSubcategory(c.id, v), { refresh: false, onOk: () => { setSubMap((m) => ({ ...m, [c.slug]: [...(m[c.slug] ?? []), v] })); setNewSub({ ...newSub, [c.slug]: "" }); } }); }}>
                <input aria-label={`Add sub-category to ${c.name}`} placeholder="+ Add" value={newSub[c.slug] ?? ""} onChange={(e) => setNewSub({ ...newSub, [c.slug]: e.target.value })} className="h-8 w-24 rounded-full border border-dashed border-line-strong bg-transparent px-3 text-[13px] focus:border-ring focus:outline-none" />
              </form>
            </div>
          </article>
        ))}
      </div>
      <Sheet open={!!edit} onClose={() => { setEdit(null); setErr(""); }} side="dialog" title={edit?.id ? "Edit category" : "New category"}
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></div>}>
        {edit && <div className="space-y-4"><Field label="Name" htmlFor="cn" error={err}><Input id="cn" value={edit.name} onChange={(e) => { setEdit({ ...edit, name: e.target.value }); setErr(""); }} invalid={!!err} /></Field><Field label="Tagline" htmlFor="ct" optional><Input id="ct" value={edit.tagline} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} /></Field></div>}
      </Sheet>
    </>
  );
}
