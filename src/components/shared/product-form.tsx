"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Plus, Star, Trash2, X } from "lucide-react";
import { ProductImage } from "@/components/brand/product-image";
import { Panel } from "@/components/shared/blocks";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/display";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { addProductImages, removeProduct, removeProductImage, saveProduct } from "@/lib/actions/manage";
import { fileExt, uploadPublicImage, validateImage } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { toast } from "@/lib/stores";
import { cn, discountPct } from "@/lib/utils";
import type { Category, Product, ProductColor } from "@/types";

const SIZE_PRESETS: Record<string, string[]> = {
  Apparel: ["XS", "S", "M", "L", "XL", "XXL"], Jeans: ["28", "30", "32", "34", "36"], Footwear: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"], "Free size": ["Free Size"], Storage: ["128GB", "256GB", "512GB"], Volume: ["30ml", "50ml", "100ml"], Pack: ["250g", "500g", "1kg"], Other: ["Standard", "One Size"],
};
const OPTION_LABEL: Record<string, string> = { Jeans: "Waist", Storage: "Storage", Volume: "Volume", Pack: "Pack" };
/** "S, M, L" → "Size", "128GB" → "Storage" … shown above the size picker on the product page. */
const labelFor = (sizes: string[]) => {
  const g = Object.entries(SIZE_PRESETS).find(([, list]) => sizes.length > 0 && sizes.every((s) => list.includes(s)));
  return (g && OPTION_LABEL[g[0]]) || "Size";
};
const MAX_PHOTOS = 6;
type NewPhoto = { key: string; file: File; preview: string };
const SWATCHES: ProductColor[] = [{ name: "Vermilion", hex: "#cc4a33" }, { name: "Indigo", hex: "#34478f" }, { name: "Marigold", hex: "#e09a1f" }, { name: "Forest", hex: "#2f6b4f" }, { name: "Ink Black", hex: "#2a2420" }, { name: "Ivory", hex: "#eee3d0" }, { name: "Dusty Rose", hex: "#c98a8a" }, { name: "Teal", hex: "#2a7f84" }];

export function ProductForm({
  product, categories, subcategories, base, role, sellers, sellerId, canPublish = false,
}: { product?: Product; categories: Category[]; subcategories: Record<string, string[]>; base: string; role: "admin" | "seller"; sellers?: { id: string; name: string }[]; sellerId?: string; canPublish?: boolean }) {
  const router = useRouter();
  const [v, setV] = useState({
    name: product?.name ?? "", cat: product?.categorySlug ?? "", sub: product?.subcategory ?? "", description: product?.description ?? "", fabric: product?.fabric ?? "",
    price: product?.price?.toString() ?? "", mrp: product?.mrp?.toString() ?? "", gst: "5", live: product ? product.status === "active" : false,
    seller: product?.sellerId ?? sellers?.[0]?.id ?? "", featured: product?.badges.includes("bestseller") ?? false,
  });
  const [colors, setColors] = useState<ProductColor[]>(product?.colors ?? [SWATCHES[0]]);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [stock, setStock] = useState<Record<string, string>>(Object.fromEntries(Object.entries(product?.stock ?? {}).map(([k, n]) => [k, String(n)])));
  // photos: already-saved ones (with their row id), ones queued for removal, and freshly picked files
  const [saved, setSaved] = useState<{ id: string; url: string }[]>(() => (product?.images ?? []).map((url, i) => ({ id: product?.imageIds?.[i] ?? "", url })).filter((x) => x.id));
  const [removed, setRemoved] = useState<string[]>([]);
  const [fresh, setFresh] = useState<NewPhoto[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoCount = saved.length + fresh.length;
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof v, val: string | boolean) => { setV((p) => ({ ...p, [k]: val })); setErrs((e) => ({ ...e, [k]: "" })); };

  const price = Number(v.price) || 0, mrp = Number(v.mrp) || 0;
  const subs = subcategories[v.cat] ?? [];
  const sil = categories.find((c) => c.slug === v.cat)?.photo ?? "decor";
  const totalStock = useMemo(() => sizes.reduce((a, s) => a + (Number(stock[s]) || 0), 0), [sizes, stock]);

  const toggleSize = (s: string) => setSizes((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  const addColor = (c: ProductColor) => !colors.some((x) => x.name === c.name) && setColors([...colors, c]);

  const pick = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photoCount; const add: NewPhoto[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      const bad = validateImage(file); if (bad) { toast.error(bad); continue; }
      add.push({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
    }
    if (files.length > room) toast.info(`Only ${MAX_PHOTOS} photos per product`);
    setFresh((l) => [...l, ...add]);
    if (fileRef.current) fileRef.current.value = "";
  };
  const dropSaved = (id: string) => { setSaved((l) => l.filter((x) => x.id !== id)); setRemoved((l) => [...l, id]); };
  const dropFresh = (key: string) => setFresh((l) => { const f = l.find((x) => x.key === key); if (f) URL.revokeObjectURL(f.preview); return l.filter((x) => x.key !== key); });

  const submit = async (publish: boolean) => {
    const er: Record<string, string> = {};
    if (v.name.trim().length < 3) er.name = "Give your product a clear name";
    if (!v.cat) er.cat = "Choose a category";
    if (v.description.trim().length < 20) er.description = "Describe the product in at least 20 characters";
    if (!(price > 0)) er.price = "Enter a selling price";
    if (mrp < price) er.mrp = "MRP must be at least the selling price";
    if (!sizes.length) er.sizes = "Select at least one size";
    if (colors.length === 0) er.colors = "Add at least one colour";
    setErrs(er);
    if (Object.keys(er).length) { toast.error("Please fix the highlighted fields"); document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setSaving(true);
    const done = () => { toast.success(publish ? (role === "seller" && !canPublish ? "Submitted for review — we’ll approve within 24h" : "Product published") : "Draft saved"); router.push(`${base}/products`); router.refresh(); };
    if (!isSupabaseConfigured()) { await new Promise((r) => setTimeout(r, 600)); done(); return; } // demo mode keeps the old behaviour
    try {
      const res = await saveProduct({
        id: product?.id, name: v.name, categorySlug: v.cat, subcategory: v.sub || undefined, description: v.description, material: v.fabric, price, mrp,
        optionLabel: product?.optionLabel && product.sizes.length && sizes.every((s) => product.sizes.includes(s)) ? product.optionLabel : labelFor(sizes),
        colors, options: sizes.map((s) => ({ value: s, stock: Number(stock[s]) || 0 })), publish, sellerId: role === "admin" ? v.seller : sellerId, featured: role === "admin" ? v.featured : undefined,
      });
      if (!res.ok) { toast.error(res.error ?? "Couldn’t save the product"); setSaving(false); return; }
      // photos go straight from the browser to Storage (folder = owning store), then get attached to the product
      const owner = role === "admin" ? v.seller : sellerId;
      if (fresh.length && owner) {
        const urls: string[] = [];
        for (const f of fresh) urls.push(await uploadPublicImage("product-images", `${owner}/${res.id}/${crypto.randomUUID()}.${fileExt(f.file)}`, f.file));
        const att = await addProductImages(res.id, urls);
        if (!att.ok) toast.error(att.error ?? "Product saved, but photos couldn’t be attached");
      }
      for (const id of removed) await removeProductImage(id);
      done();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again."); setSaving(false); }
  };

  const archive = async () => {
    if (!product) return;
    if (!isSupabaseConfigured()) { toast.info("Product archived (demo)"); router.push(`${base}/products`); return; }
    if (!window.confirm("Archive this product? It will disappear from the store.")) return;
    const r = await removeProduct(product.id);
    if (!r.ok) { toast.error(r.error ?? "Couldn’t archive"); return; }
    toast.success(r.archived ? "Product archived (it has past orders)" : "Product deleted"); router.push(`${base}/products`); router.refresh();
  };

  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(v.live); }} className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <Panel title="Basic information">
          <div className="space-y-4">
            <Field label="Product name" htmlFor="pn" error={errs.name}><Input id="pn" value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Wireless Noise-cancelling Headphones" invalid={!!errs.name} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor="pc" error={errs.cat}><Select id="pc" value={v.cat} onChange={(e) => { set("cat", e.target.value); set("sub", ""); }} invalid={!!errs.cat}><option value="">Select category</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</Select></Field>
              <Field label="Sub-category" htmlFor="ps" optional><Select id="ps" value={v.sub} onChange={(e) => set("sub", e.target.value)} disabled={!subs.length}><option value="">Select</option>{subs.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            </div>
            <Field label="Description" htmlFor="pd" error={errs.description} hint={`${v.description.length}/600 characters`}><Textarea id="pd" rows={4} maxLength={600} value={v.description} onChange={(e) => set("description", e.target.value)} invalid={!!errs.description} placeholder="Fit, feel, occasion, what makes it special…" /></Field>
            <Field label="Fabric & care" htmlFor="pf" optional><Input id="pf" value={v.fabric} onChange={(e) => set("fabric", e.target.value)} placeholder="100% handloom cotton · Machine wash cold" /></Field>
          </div>
        </Panel>

        <Panel title="Photos" action={<span className="text-xs text-muted">{photoCount}/{MAX_PHOTOS}</span>}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {saved.map((p, i) => (
              <div key={p.id} className="group relative aspect-[3/4] overflow-hidden border border-line">
                <ProductImage photo={sil} src={p.url} rounded={false} sizes="160px" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 bg-ink px-2 py-0.5 text-[10px] font-semibold text-white"><Star className="size-3 fill-current" /> Cover</span>}
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => dropSaved(p.id)} className="absolute right-1.5 top-1.5 grid size-7 place-items-center bg-white/90 opacity-100 shadow md:opacity-0 md:group-hover:opacity-100"><X className="size-3.5" /></button>
              </div>
            ))}
            {fresh.map((p, i) => (
              <div key={p.key} className="group relative aspect-[3/4] overflow-hidden border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt="" className="size-full object-cover" />
                {saved.length + i === 0 && <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 bg-ink px-2 py-0.5 text-[10px] font-semibold text-white"><Star className="size-3 fill-current" /> Cover</span>}
                <span className="absolute bottom-1.5 left-1.5 bg-gold-500 px-1.5 py-0.5 text-[10px] font-semibold text-ink">New</span>
                <button type="button" aria-label="Remove new photo" onClick={() => dropFresh(p.key)} className="absolute right-1.5 top-1.5 grid size-7 place-items-center bg-white/90 opacity-100 shadow md:opacity-0 md:group-hover:opacity-100"><X className="size-3.5" /></button>
              </div>
            ))}
            {photoCount < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-[3/4] place-items-center border-2 border-dashed border-line-strong text-muted transition-colors hover:bg-bg-subtle">
                <span className="flex flex-col items-center gap-1.5 text-xs font-medium"><ImagePlus className="size-6" />Add photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" aria-label="Choose product photos" onChange={(e) => pick(e.target.files)} />
          <p className="mt-3 text-xs text-muted">JPG, PNG or WebP up to 5 MB. Use bright, natural-light photos on a plain background — the first photo is the cover. {isSupabaseConfigured() ? "" : "(Uploads are saved once Supabase is connected.)"}</p>
        </Panel>

        <Panel title="Pricing">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Selling price (₹)" htmlFor="pp" error={errs.price}><Input id="pp" inputMode="numeric" value={v.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} invalid={!!errs.price} /></Field>
            <Field label="MRP (₹)" htmlFor="pm" error={errs.mrp}><Input id="pm" inputMode="numeric" value={v.mrp} onChange={(e) => set("mrp", e.target.value.replace(/\D/g, ""))} invalid={!!errs.mrp} /></Field>
            <Field label="GST" htmlFor="pg"><Select id="pg" value={v.gst} onChange={(e) => set("gst", e.target.value)}><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option></Select></Field>
          </div>
          {price > 0 && mrp >= price && <p className="mt-3 rounded-ctl bg-success-bg px-3.5 py-2.5 text-[13px] text-success">Customers see <b>{discountPct(price, mrp)}% off</b>.{role === "seller" ? ` You’ll earn about ₹${Math.round(price * 0.88)} per sale after the 12% marketplace fee.` : ""}</p>}
        </Panel>

        <Panel title="Variants & stock">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-[13px] font-medium">Colours {errs.colors && <span className="font-normal text-danger">— {errs.colors}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => <span key={c.name} className="inline-flex h-9 items-center gap-2 rounded-full border border-line-strong bg-card pl-2 pr-1 text-[13px]"><span className="size-5 rounded-full border border-black/10" style={{ background: c.hex }} />{c.name}<button type="button" aria-label={`Remove ${c.name}`} onClick={() => setColors(colors.filter((x) => x.name !== c.name))} className="grid size-7 place-items-center rounded-full hover:bg-bg-subtle"><X className="size-3.5" /></button></span>)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2" aria-label="Quick-add colours">{SWATCHES.filter((s) => !colors.some((c) => c.name === s.name)).map((s) => <button type="button" key={s.name} onClick={() => addColor(s)} title={`Add ${s.name}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-line-strong pl-1.5 pr-3 text-xs text-muted hover:bg-bg-subtle"><span className="size-4 rounded-full border border-black/10" style={{ background: s.hex }} /><Plus className="size-3" />{s.name}</button>)}</div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-medium">Sizes {errs.sizes && <span className="font-normal text-danger">— {errs.sizes}</span>}</p>
              <div className="space-y-2.5">
                {Object.entries(SIZE_PRESETS).map(([g, list]) => (
                  <div key={g} className="flex flex-wrap items-center gap-2"><span className="w-20 text-xs text-muted">{g}</span>{list.map((s) => <button type="button" key={s} aria-pressed={sizes.includes(s)} onClick={() => toggleSize(s)} className={cn("h-9 min-w-10 rounded-full border px-3 text-[13px] font-medium", sizes.includes(s) ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card hover:bg-bg-subtle")}>{s}</button>)}</div>
                ))}
              </div>
            </div>

            {sizes.length > 0 && (
              <div>
                <p className="mb-2 flex items-center justify-between text-[13px] font-medium">Stock per size <span className="font-normal text-muted">{totalStock} units total</span></p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {sizes.map((s) => (
                    <label key={s} className="flex items-center gap-2 rounded-ctl border border-line bg-bg px-3 py-2"><span className="w-14 shrink-0 text-sm font-semibold">{s}</span>
                      <input inputMode="numeric" aria-label={`Stock for ${s}`} value={stock[s] ?? ""} placeholder="0" onChange={(e) => setStock({ ...stock, [s]: e.target.value.replace(/\D/g, "") })} className="h-9 w-full min-w-0 rounded-lg border border-line-strong bg-card px-2 text-right text-sm tabular focus:border-ring focus:outline-none" />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>

        {role === "admin" && sellers && (
          <Panel title="Marketplace">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Seller" htmlFor="sl"><Select id="sl" value={v.seller} onChange={(e) => set("seller", e.target.value)}>{sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
              <div className="flex items-center justify-between rounded-ctl border border-line px-4 py-3"><div><p className="text-sm font-medium">Feature on homepage</p><p className="text-xs text-muted">Adds the Bestseller badge</p></div><Switch label="Feature" checked={v.featured} onChange={(b) => set("featured", b)} /></div>
            </div>
          </Panel>
        )}

        {/* Sticky action bar — sits above the mobile tab bar */}
        <div className="sticky bottom-[calc(var(--tabbar-h)+10px+env(safe-area-inset-bottom))] z-10 flex items-center gap-3 rounded-card border border-line bg-card/95 p-3 shadow-pop backdrop-blur lg:bottom-4">
          <label className="mr-auto flex items-center gap-2.5 pl-1 text-sm font-medium"><Switch label="Publish" checked={v.live} onChange={(b) => set("live", b)} /><span className="hidden sm:inline">{v.live ? "Publish on save" : "Save as draft"}</span></label>
          <Button type="button" variant="outline" onClick={() => router.push(`${base}/products`)}>Cancel</Button>
          <Button type="submit" loading={saving}>{product ? "Save changes" : role === "seller" ? (canPublish ? "Publish product" : "Submit for review") : "Create product"}</Button>
        </div>
      </div>

      {/* Live preview */}
      <aside className="hidden xl:block">
        <div className="sticky top-24 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Storefront preview</p>
          <div className="rounded-card border border-line bg-card p-3 shadow-card">
            <div className="aspect-[3/4] overflow-hidden rounded-ctl">{fresh[0] && saved.length === 0 ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fresh[0].preview} alt="" className="size-full object-cover" /> : <ProductImage photo={sil} src={saved[0]?.url} color={colors[0]?.hex ?? "#cc4a33"} />}</div>
            <div className="px-1 pb-1 pt-3"><p className="truncate text-[15px] font-medium">{v.name || "Product name"}</p><Price price={price || 0} mrp={mrp || undefined} className="mt-1" />
              <div className="mt-2 flex gap-1">{colors.map((c) => <span key={c.name} className="size-3.5 rounded-full border border-black/10" style={{ background: c.hex }} />)}</div></div>
          </div>
          {product && <Button type="button" variant="ghost" size="sm" className="text-danger hover:bg-danger-bg" onClick={archive}><Trash2 className="size-4" /> Archive product</Button>}
        </div>
      </aside>
    </form>
  );
}
