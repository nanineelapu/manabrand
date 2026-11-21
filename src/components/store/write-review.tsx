"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, PenLine, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { submitReview } from "@/lib/actions/store";
import { browserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { toast } from "@/lib/stores";
import { useAct } from "@/lib/actions/use-act";
import { cn } from "@/lib/utils";

export function WriteReview({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0); const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const { act, busy } = useAct();
  const router = useRouter();

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!rating) e.rating = "Choose a rating";
    if (body.trim().length < 10) e.body = "Please write at least a few words";
    setErr(e); if (Object.keys(e).length) return;
    // upload the photos straight to Storage (into this customer's own folder), then send the links with the review
    const images: string[] = [];
    if (photos.length && isSupabaseConfigured()) {
      const sb = browserClient();
      const { data: u } = await sb.auth.getUser();
      if (u.user) {
        for (const p of photos) {
          const ext = p.file.type === "image/png" ? "png" : p.file.type === "image/webp" ? "webp" : "jpg";
          const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
          const up = await sb.storage.from("review-images").upload(path, p.file, { contentType: p.file.type, upsert: false });
          if (!up.error) images.push(sb.storage.from("review-images").getPublicUrl(path).data.publicUrl);
        }
        if (images.length < photos.length) toast.error("Some photos couldn’t be uploaded — your review was sent without them.");
      }
    }
    const r = await act(() => submitReview({ productId, rating, title, body, images }), {
      success: "Thanks! Your review will appear after moderation.", onOk: () => { setOpen(false); setRating(0); setTitle(""); setBody(""); setPhotos([]); },
    });
    if (r && !r.ok && !r.demo && /sign in/i.test(r.error ?? "")) router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><PenLine className="size-4" /> Write a review</Button>
      <Sheet open={open} onClose={() => setOpen(false)} side="dialog" title="Write a review" description={productName}
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={submit}>Submit review</Button></div>}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-medium">Your rating {err.rating && <span className="font-normal text-danger">— {err.rating}</span>}</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => { setRating(n); setErr((x) => ({ ...x, rating: "" })); }}
                  className="grid size-11 place-items-center transition-transform active:scale-90">
                  <Star className={cn("size-7 transition-colors", n <= rating ? "fill-gold-500 text-gold-500" : "text-line-strong")} />
                </button>
              ))}
            </div>
          </div>
          <Field label="Headline" htmlFor="rv-t" optional><Input id="rv-t" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a few words" /></Field>
          <Field label="Your review" htmlFor="rv-b" error={err.body} hint="Only customers who received this product can review it."><Textarea id="rv-b" rows={4} value={body} maxLength={1000} onChange={(e) => { setBody(e.target.value); setErr((x) => ({ ...x, body: "" })); }} invalid={!!err.body} /></Field>
          <div>
            <p className="mb-2 text-[13px] font-medium">Add photos <span className="font-normal text-muted">(optional, up to 3)</span></p>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={p.url} className="relative size-20 overflow-hidden rounded-lg border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="Selected photo" className="size-full object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => { URL.revokeObjectURL(p.url); setPhotos((x) => x.filter((_, j) => j !== i)); }} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-white"><X className="size-3.5" /></button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="grid size-20 cursor-pointer place-items-center rounded-lg border border-dashed border-line-strong text-muted hover:bg-bg-subtle">
                  <Camera className="size-6" /><span className="sr-only">Add a photo</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    const ok = picked.filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 4 * 1024 * 1024);
                    if (ok.length < picked.length) toast.error("Photos must be JPG, PNG or WebP, up to 4 MB each.");
                    setPhotos((x) => [...x, ...ok.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 3));
                    e.target.value = "";
                  }} />
                </label>
              )}
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
