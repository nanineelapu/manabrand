"use client";

import { useState } from "react";
import { Download, LifeBuoy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { cancelOrder } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";
import { toast } from "@/lib/stores";
import type { OrderStatus } from "@/types";

const reasons = ["Ordered by mistake", "Found a better price", "Delivery address is wrong", "Want to change the items", "Changed my mind"];

export function OrderActions({ orderId, number, status }: { orderId: string; number: string; status: OrderStatus; items?: { itemId?: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(""); const [note, setNote] = useState(""); const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const { act, busy } = useAct();

  const canCancel = ["placed", "confirmed"].includes(status) && !done;
  const close = () => { setOpen(false); setErr(""); setReason(""); setNote(""); };

  const submit = async () => {
    if (!reason) { setErr("Please choose a reason"); return; }
    await act(() => cancelOrder(orderId, [reason, note].filter(Boolean).join(" — ")), { success: `${number} cancelled — any payment will be refunded`, onOk: () => { setDone(true); close(); } });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={() => toast.info("Invoice will be emailed to you")}><Download className="size-4" /> Invoice</Button>
        {canCancel && <Button variant="outline" onClick={() => setOpen(true)}><XCircle className="size-4" /> Cancel order</Button>}
        <Button href="/contact" variant="ghost"><LifeBuoy className="size-4" /> Need help?</Button>
      </div>
      {done && <p role="status" className="mt-3 bg-info-bg px-4 py-3 text-sm font-medium text-info">Order cancelled — we’ll email you the details.</p>}

      <Sheet open={open} onClose={close} side="dialog" title="Cancel this order?" description="Your refund goes back to the original payment method."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={close}>Keep order</Button><Button variant="danger" loading={busy} onClick={submit}>Cancel order</Button></div>}>
        <div className="space-y-4">
          <Field label="Reason" htmlFor="rs" error={err}><Select id="rs" value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} invalid={!!err}><option value="">Select a reason</option>{reasons.map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Field label="Anything else?" htmlFor="nt" optional><Textarea id="nt" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell us more…" /></Field>
        </div>
      </Sheet>
    </>
  );
}
