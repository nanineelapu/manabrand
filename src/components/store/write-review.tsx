"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PenLine, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { submitReview } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";
import { cn } from "@/lib/utils";

export function WriteReview({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0); const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const { act, busy } = useAct();
  const router = useRouter();

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!rating) e.rating = "Choose a rating";
    if (body.trim().length < 10) e.body = "Please write at least a few words";
    setErr(e); if (Object.keys(e).length) return;
    const r = await act(() => submitReview({ productId, rating, title, body }), {
      success: "Thanks! Your review will appear after moderation.", onOk: () => { setOpen(false); setRating(0); setTitle(""); setBody(""); },
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
        </div>
      </Sheet>
    </>
  );
}
