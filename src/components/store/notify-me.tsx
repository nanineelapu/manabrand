"use client";

import { useState } from "react";
import { BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { subscribeStockAlert } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";

/** "Email me when it's back" — shown under a sold-out size (or on a sold-out product). `size` empty = any size. */
export function NotifyMe({ productId, size, sizes, collapsed }: { productId: string; size?: string; sizes?: string[]; collapsed?: boolean }) {
  const [pick, setPick] = useState(sizes?.[0] ?? size ?? "");
  const [open, setOpen] = useState(!collapsed);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const { act, busy } = useAct();

  const chosen = sizes ? pick : size ?? "";
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium underline underline-offset-4"><BellRing className="size-4" /> Your size sold out? Get notified when it’s back</button>;
  if (done) return <p className="mt-3 flex items-center gap-2 rounded-ctl bg-success-bg px-3.5 py-3 text-sm font-medium text-success"><Check className="size-4" /> Done — we’ll email you when it’s back{chosen ? ` in ${chosen}` : ""}.</p>;
  return (
    <form className="mt-3 rounded-ctl border border-line bg-bg-subtle p-3.5" noValidate onSubmit={(e) => {
      e.preventDefault();
      if (!/^\S+@\S+\.\S+$/.test(email)) { setErr("Enter a valid email"); return; }
      setErr("");
      act(() => subscribeStockAlert({ productId, size: chosen, email }), { success: "We’ll email you", onOk: () => setDone(true), refresh: false });
    }}>
      <p className="flex items-center gap-2 text-sm font-semibold"><BellRing className="size-4" /> {sizes ? "Sold-out sizes" : size ? `${size} is sold out` : "Sold out"} — get notified</p>
      {sizes && <div className="mt-2 flex flex-wrap gap-2">{sizes.map((s) => <button key={s} type="button" aria-pressed={pick === s} onClick={() => setPick(s)} className={"h-9 rounded-lg border px-3 text-sm font-medium " + (pick === s ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card")}>{s}</button>)}</div>}
      <div className="mt-2.5 flex gap-2">
        <Input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} invalid={!!err} aria-label="Email for back-in-stock alert" />
        <Button type="submit" loading={busy} className="shrink-0">Notify me</Button>
      </div>
      {err && <p role="alert" className="mt-1.5 text-xs text-danger">{err}</p>}
    </form>
  );
}
