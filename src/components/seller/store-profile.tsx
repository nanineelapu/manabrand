"use client";

import { useRef, useState } from "react";
import { BadgeCheck, Camera, CheckCircle2, FileUp, Landmark, MapPin, Palmtree } from "lucide-react";
import { Panel } from "@/components/shared/blocks";
import { StatusBadge } from "@/components/shared/status";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch, Textarea } from "@/components/ui/form";
import { recordKycDocument, saveStoreProfile } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { fileExt, uploadKyc, uploadPublicImage, validateImage } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { toast } from "@/lib/stores";
import { cn } from "@/lib/utils";
import type { Seller } from "@/types";

const DOCS = [["pan", "PAN card"], ["gst", "GST certificate"], ["cancelled_cheque", "Cancelled cheque"], ["address_proof", "Address proof"]] as const;

export function StoreProfile({ seller }: { seller: Seller }) {
  const { act, busy } = useAct();
  const [v, setV] = useState({ name: seller.name, about: seller.blurb, phone: seller.phone, email: seller.email, pickup: seller.pickupAddress ?? "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [holiday, setHoliday] = useState(Boolean(seller.holidayMode));
  const [notify, setNotify] = useState({ orders: true, stock: true, payouts: true });
  const [logo, setLogo] = useState(seller.logoUrl); const [banner, setBanner] = useState(seller.bannerUrl);
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const logoRef = useRef<HTMLInputElement>(null), bannerRef = useRef<HTMLInputElement>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault(); const er: Record<string, string> = {};
    if (v.name.trim().length < 2) er.name = "Store name is required";
    if (v.about.trim().length < 20) er.about = "Write at least 20 characters";
    if (!/^\S+@\S+\.\S+$/.test(v.email)) er.email = "Enter a valid email";
    setErrs(er);
    if (!Object.keys(er).length) act(() => saveStoreProfile({ name: v.name, blurb: v.about, phone: v.phone, email: v.email, pickupAddress: v.pickup, holidayMode: holiday }), { success: "Store profile saved", refresh: true });
  };

  /** Browser → Storage directly (policies restrict each seller to their own folder), then the URL is saved on the store. */
  const pickImage = async (file: File | undefined, kind: "logo" | "banner") => {
    if (!file) return;
    const bad = validateImage(file); if (bad) { toast.error(bad); return; }
    if (!isSupabaseConfigured()) { toast.info("Image uploads work once Supabase is connected"); return; }
    try {
      const url = await uploadPublicImage("seller-assets", `${seller.id}/${kind}-${crypto.randomUUID()}.${fileExt(file)}`, file);
      await act(() => saveStoreProfile({ name: v.name, blurb: v.about, phone: v.phone, email: v.email, pickupAddress: v.pickup, ...(kind === "logo" ? { logoUrl: url } : { bannerUrl: url }) }),
        { success: kind === "logo" ? "Logo updated" : "Banner updated", onOk: () => (kind === "logo" ? setLogo(url) : setBanner(url)) });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
  };

  const pickDoc = async (file: File | undefined, type: (typeof DOCS)[number][0]) => {
    if (!file) return;
    if (!isSupabaseConfigured()) { toast.info("Document uploads work once Supabase is connected"); return; }
    try {
      const path = await uploadKyc(`${seller.id}/${type}-${crypto.randomUUID()}.${fileExt(file)}`, file);
      await act(() => recordKycDocument(type, path), { success: "Document uploaded for review", refresh: false, onOk: () => setUploaded((u) => ({ ...u, [type]: true })) });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <Panel title="Store identity" padded={false}>
          <div className="relative h-32 bg-cover bg-center md:h-40" style={{ background: banner ? `center / cover url(${banner})` : `linear-gradient(120deg, ${seller.tone[0]}, ${seller.tone[1]})` }}>
            <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload banner" onChange={(e) => pickImage(e.target.files?.[0], "banner")} />
            <button type="button" onClick={() => bannerRef.current?.click()} className="absolute right-3 top-3 inline-flex h-9 items-center gap-2 bg-white/90 px-3.5 text-[13px] font-medium shadow"><Camera className="size-4" /> Change banner</button>
          </div>
          <form onSubmit={save} noValidate className="space-y-4 p-4 pt-0 md:p-5 md:pt-0">
            <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Upload logo" onChange={(e) => pickImage(e.target.files?.[0], "logo")} />
            <button type="button" onClick={() => logoRef.current?.click()} aria-label="Change logo" className="-mt-10 grid size-20 place-items-center overflow-hidden border-4 border-card text-4xl font-semibold text-white shadow-card" style={{ background: logo ? `center / cover url(${logo})` : seller.tone[1] }}>{!logo && seller.name[0]}</button>
            <Field label="Store name" htmlFor="sn" error={errs.name}><Input id="sn" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} invalid={!!errs.name} /></Field>
            <Field label="About your craft" htmlFor="sa" error={errs.about} hint={`${v.about.length}/300`}><Textarea id="sa" rows={3} maxLength={300} value={v.about} onChange={(e) => setV({ ...v, about: e.target.value })} invalid={!!errs.about} /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Contact email" htmlFor="se" error={errs.email}><Input id="se" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} invalid={!!errs.email} /></Field><Field label="Contact phone" htmlFor="sp"><Input id="sp" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></Field></div>
            <Field label="Pickup address" htmlFor="pk" hint="Couriers collect orders from here."><Textarea id="pk" rows={2} value={v.pickup} onChange={(e) => setV({ ...v, pickup: e.target.value })} /></Field>
            <Button type="submit" size="lg" loading={busy}>Save profile</Button>
          </form>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Verification" action={<StatusBadge status={seller.kyc} />}>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><BadgeCheck className={cn("size-5", seller.kyc === "verified" ? "text-success" : "text-subtle")} /><span className="flex-1">{seller.kyc === "verified" ? "KYC verified" : "KYC pending review"}</span></li>
            <li className="flex items-center gap-3"><MapPin className="size-5 text-muted" /><span className="flex-1 font-mono text-[13px]">{seller.gstin || "GSTIN not added"}</span></li>
            <li className="flex items-center gap-3"><Landmark className="size-5 text-muted" /><span className="flex-1">{seller.bankLast4 ? `Bank account ••${seller.bankLast4}` : "Bank account not added"}</span></li>
          </ul>
          <p className="mb-2 mt-5 text-[13px] font-medium">Documents <span className="font-normal text-muted">(PDF, JPG or PNG · private, only ManaBrand admins can view)</span></p>
          <div className="space-y-2">
            {DOCS.map(([type, label]) => (
              <label key={type} className={cn("flex cursor-pointer items-center gap-3 border-2 border-dashed p-3 text-sm transition-colors", uploaded[type] ? "border-success bg-success-bg" : "border-line-strong bg-card hover:bg-bg-subtle")}>
                {uploaded[type] ? <CheckCircle2 className="size-5 text-success" /> : <FileUp className="size-5 text-muted" />}
                <span className="flex-1 font-medium">{label}</span><span className="text-xs text-muted">{uploaded[type] ? "Uploaded ✓" : "Choose file"}</span>
                <input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" aria-label={`Upload ${label}`} onChange={(e) => pickDoc(e.target.files?.[0], type)} />
              </label>
            ))}
          </div>
        </Panel>
        <Panel title="Holiday mode"><div className="flex items-start gap-3"><Palmtree className="mt-0.5 size-5 shrink-0 text-gold-500" /><div className="flex-1"><p className="text-sm font-medium">Pause new orders</p><p className="text-xs text-muted">Your products stay visible but can’t be bought until you’re back.</p></div>
          <Switch label="Holiday mode" checked={holiday} onChange={(b) => act(() => saveStoreProfile({ name: v.name, blurb: v.about, phone: v.phone, email: v.email, pickupAddress: v.pickup, holidayMode: b }), { success: b ? "Holiday mode on" : "Welcome back!", refresh: false, onOk: () => setHoliday(b) })} /></div></Panel>
        <Panel title="Notify me about">
          <div className="space-y-4">
            {([["orders", "New orders & returns"], ["stock", "Low stock alerts"], ["payouts", "Payout updates"]] as const).map(([k, l]) => <div key={k} className="flex items-center justify-between gap-3"><span className="text-sm">{l}</span><Switch label={l} checked={notify[k]} onChange={(b) => setNotify({ ...notify, [k]: b })} /></div>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}
