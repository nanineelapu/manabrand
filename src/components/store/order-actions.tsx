"use client";

import { useState } from "react";
import { Download, LifeBuoy, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { cancelOrder, requestReturn } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";
import { toast } from "@/lib/stores";
import type { OrderStatus } from "@/types";

const cancelReasons = ["Ordered by mistake", "Found a better price", "Delivery address is wrong", "Want to change the items", "Changed my mind"];
const returnReasons = ["Size does not fit", "Defective or damaged piece", "Different from pictures / colour mismatch", "Quality not as expected", "Wrong item sent"];

export function OrderActions({ orderId, number, status, items = [] }: { orderId: string; number: string; status: OrderStatus; items?: { itemId?: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const [returnOpen, setReturnOpen] = useState(false);
  const [retItem, setRetItem] = useState(items[0]?.itemId ?? "");
  const [retReason, setRetReason] = useState("");
  const [retNote, setRetNote] = useState("");
  const [retErr, setRetErr] = useState("");
  const [retDone, setRetDone] = useState(false);

  const { act, busy } = useAct();

  const canCancel = ["placed", "confirmed"].includes(status) && !done;
  const canReturn = status === "delivered" && !retDone && items.length > 0;

  const closeCancel = () => { setOpen(false); setErr(""); setReason(""); setNote(""); };
  const closeReturn = () => { setReturnOpen(false); setRetErr(""); setRetReason(""); setRetNote(""); };

  const submitCancel = async () => {
    if (!reason) { setErr("Please choose a reason"); return; }
    await act(() => cancelOrder(orderId, [reason, note].filter(Boolean).join(" — ")), {
      success: `${number} cancelled`,
      onOk: () => { setDone(true); closeCancel(); },
    });
  };

  const submitReturn = async () => {
    if (!retItem) { setRetErr("Please select an item"); return; }
    if (!retReason) { setRetErr("Please choose a reason"); return; }
    if (!retNote.trim()) { setRetErr("Tell us the size or colour you want instead."); return; }
    await act(() => requestReturn({ orderId, itemId: retItem, reason: retReason, note: retNote }), {
      success: `Exchange requested for ${number} — our team will arrange pickup`,
      onOk: () => { setRetDone(true); closeReturn(); },
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={() => toast.info("Invoice will be emailed to you")}><Download className="size-4" /> Invoice</Button>
        {canCancel && <Button variant="outline" onClick={() => setOpen(true)}><XCircle className="size-4" /> Cancel order</Button>}
        {canReturn && <Button variant="outline" onClick={() => setReturnOpen(true)}><RotateCcw className="size-4" /> Request exchange</Button>}
        <Button href="/contact" variant="ghost"><LifeBuoy className="size-4" /> Need help?</Button>
      </div>

      {done && <p role="status" className="mt-3 bg-info-bg px-4 py-3 text-sm font-medium text-info">Order cancelled — we’ll email you the details.</p>}
      {retDone && <p role="status" className="mt-3 bg-success-bg px-4 py-3 text-sm font-medium text-success">Exchange request submitted — our delivery team will contact you to collect the item and bring your replacement.</p>}

      {/* Cancel Order Sheet */}
      <Sheet open={open} onClose={closeCancel} side="dialog" title="Cancel this order?" description="Your order will be cancelled. Wallet money you used goes back to your wallet, and any online payment is returned to the way you paid."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={closeCancel}>Keep order</Button><Button variant="danger" loading={busy} onClick={submitCancel}>Cancel order</Button></div>}>
        <div className="space-y-4">
          <Field label="Reason" htmlFor="rs" error={err}><Select id="rs" value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} invalid={!!err}><option value="">Select a reason</option>{cancelReasons.map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Field label="Anything else?" htmlFor="nt" optional><Textarea id="nt" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell us more…" /></Field>
        </div>
      </Sheet>

      {/* Request Exchange Sheet */}
      <Sheet open={returnOpen} onClose={closeReturn} side="dialog" title="Request an exchange" description="ManaBrand offers exchanges only — no refunds. Swap for another size or colour within 7 days of delivery. We collect the item from your delivery address."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={closeReturn}>Keep item</Button><Button loading={busy} onClick={submitReturn}>Request exchange</Button></div>}>
        <div className="space-y-4">
          {items.length > 1 && (
            <Field label="Item to exchange" htmlFor="ret-item">
              <Select id="ret-item" value={retItem} onChange={(e) => { setRetItem(e.target.value); setRetErr(""); }}>
                {items.map((it) => (
                  <option key={it.itemId} value={it.itemId}>{it.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Reason" htmlFor="ret-rs" error={retErr}>
            <Select id="ret-rs" value={retReason} onChange={(e) => { setRetReason(e.target.value); setRetErr(""); }} invalid={!!retErr}>
              <option value="">Select a reason</option>
              {returnReasons.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Size / colour you want instead" htmlFor="ret-nt" hint="We will bring this as your replacement.">
            <Textarea id="ret-nt" value={retNote} onChange={(e) => setRetNote(e.target.value)} placeholder="e.g. Size L, same colour" />
          </Field>
        </div>
      </Sheet>
    </>
  );
}
