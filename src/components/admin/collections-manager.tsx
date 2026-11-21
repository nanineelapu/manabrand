"use client";

import { useMemo, useState } from "react";
import { Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { removeCollection, saveCollection } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import type { PhotoKind } from "@/lib/images";
import type { Collection } from "@/types";

interface Pick { id: string; name: string; category: string }
type Draft = { id?: string; name: string; story: string; photo: PhotoKind; productIds: string[] };

const COVERS: [PhotoKind, string][] = [
  ["dress", "Dresses"], ["saree", "Sarees"], ["kurta", "Kurtas"], ["shirt", "Shirts"], ["tee", "Tees"], ["jacket", "Jackets"],
  ["jeans", "Denim"], ["hoodie", "Hoodies"], ["sneaker", "Sneakers"], ["bag", "Bags"], ["jewellery", "Jewellery"], ["watch", "Watches"],
  ["sunglasses", "Eyewear"],
];

/** Admin → Collections: create themed groups of products, rename them, pick the cover photo, add / remove products, delete. */
export function CollectionsManager({ collections, products }: { collections: Collection[]; products: Pick[] }) {
  const [list, setList] = useState(collections);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState<Collection | null>(null);
  const { act, busy } = useAct();
  const names = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

  const open = (c?: Collection) => { setErr(""); setQ(""); setDraft(c ? { id: c.id, name: c.name, story: c.story, photo: c.photo, productIds: [...c.productIds] } : { name: "", story: "", photo: "decor", productIds: [] }); };
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => !t || p.name.toLowerCase().includes(t) || p.category.includes(t));
  }, [products, q]);
  const toggle = (id: string) => setDraft((d) => d && ({ ...d, productIds: d.productIds.includes(id) ? d.productIds.filter((x) => x !== id) : [...d.productIds, id] }));

  const save = () => {
    if (!draft) return;
    if (draft.name.trim().length < 2) { setErr("Give the collection a name"); return; }
    const local = (id: string) => setList((l) => (draft.id ? l.map((c) => (c.id === draft.id ? { ...c, name: draft.name, story: draft.story, photo: draft.photo, productIds: draft.productIds } : c))
      : [...l, { id, slug: draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: draft.name, story: draft.story, tone: ["#efe9dc", "#0f6b52"] as [string, string], photo: draft.photo, productIds: draft.productIds }]));
    act(() => saveCollection({ id: draft.id, name: draft.name, story: draft.story, photo: draft.photo, productIds: draft.productIds }),
      { success: draft.id ? "Collection saved" : "Collection created", onOk: (r) => { local("id" in r && r.id ? (r.id as string) : `c${Date.now()}`); setDraft(null); }, onDemo: () => { local(`c${Date.now()}`); setDraft(null); } });
  };

  return (
    <>
      <div className="mb-5 flex justify-end"><Button onClick={() => open()}><Plus className="size-4" /> New collection</Button></div>

      {list.length === 0 ? (
        <EmptyState icon={<Layers />} title="No collections yet" body="Create your first collection — for example “Festival gifts” — and pick the products that belong in it." action={<Button onClick={() => open()}><Plus className="size-4" /> New collection</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <article key={c.id} className="overflow-hidden rounded-card border border-line bg-card shadow-card">
              <div className="relative aspect-[16/8]"><ProductImage photo={c.photo} seed={c.slug} w={700} h={350} sizes="400px" rounded={false} />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-3 left-4 right-4 truncate text-lg font-semibold text-white">{c.name}</p></div>
              <div className="space-y-3 p-4">
                <p className="line-clamp-2 min-h-[2.5rem] text-[13px] text-muted">{c.story || "No description"}</p>
                <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                  <span className="text-sm font-medium">{c.productIds.length} product{c.productIds.length === 1 ? "" : "s"}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => open(c)}><Pencil className="size-3.5" /> Edit</Button>
                    <Button size="sm" variant="ghost" aria-label={`Delete ${c.name}`} className="text-danger hover:bg-danger-bg" onClick={() => setConfirmDel(c)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* create / edit */}
      <Sheet open={!!draft} onClose={() => setDraft(null)} side="dialog" title={draft?.id ? "Edit collection" : "New collection"} className="md:max-w-2xl"
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button loading={busy} onClick={save}>Save collection</Button></div>}>
        {draft && (
          <div className="space-y-4">
            <Field label="Name" htmlFor="cn" error={err}><Input id="cn" value={draft.name} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setErr(""); }} invalid={!!err} placeholder="e.g. Festival gifts" /></Field>
            <Field label="Description" htmlFor="cd" optional hint={`${draft.story.length}/200`}><Textarea id="cd" rows={2} maxLength={200} value={draft.story} onChange={(e) => setDraft({ ...draft, story: e.target.value })} placeholder="One line shoppers see under the name" /></Field>
            <Field label="Cover photo" htmlFor="cp"><Select id="cp" value={draft.photo} onChange={(e) => setDraft({ ...draft, photo: e.target.value as PhotoKind })}>{COVERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>

            <div>
              <div className="mb-2 flex items-center justify-between"><p className="text-[13px] font-medium">Products in this collection</p><span className="text-xs text-muted">{draft.productIds.length} selected</span></div>
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" /><Input aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="pl-9" /></div>
              <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto border border-line" data-lenis-prevent>
                {shown.map((p) => (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-bg-subtle">
                      <input type="checkbox" checked={draft.productIds.includes(p.id)} onChange={() => toggle(p.id)} className="size-4 accent-[var(--primary)]" />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span><span className="shrink-0 text-xs capitalize text-muted">{p.category}</span>
                    </label>
                  </li>
                ))}
                {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No products match “{q}”.</li>}
              </ul>
              {draft.productIds.length > 0 && <p className="mt-2 line-clamp-2 text-xs text-muted">Selected: {draft.productIds.map((id) => names.get(id)).filter(Boolean).join(", ")}</p>}
            </div>
          </div>
        )}
      </Sheet>

      {/* delete confirmation */}
      <Sheet open={!!confirmDel} onClose={() => setConfirmDel(null)} side="dialog" title="Delete this collection?" description="The products stay in your shop — only the group is removed."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setConfirmDel(null)}>Keep it</Button>
          <Button variant="danger" loading={busy} onClick={() => confirmDel && act(() => removeCollection(confirmDel.id), { success: "Collection deleted", onOk: () => { setList((l) => l.filter((x) => x.id !== confirmDel.id)); setConfirmDel(null); } })}>Delete</Button></div>}>
        <p className="text-sm">“{confirmDel?.name}” will no longer appear on the storefront.</p>
      </Sheet>
    </>
  );
}
