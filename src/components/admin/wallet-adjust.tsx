"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { adjustWallet } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";

/** Admin: give a customer wallet credit (goodwill, refund for a cash order…) or take some back. */
export function WalletAdjust({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ dir: "add", amount: "", note: "" });
  const [err, setErr] = useState("");
  const { act, busy } = useAct();
  const save = () => {
    if (busy) return;
    const n = Number(f.amount.replace(/\D/g, ""));
    if (!n) { setErr("Enter an amount."); return; }
    setErr("");
    act(() => adjustWallet(userId, f.dir === "add" ? n : -n, f.note), { success: "Wallet updated", onOk: () => { setOpen(false); setF({ dir: "add", amount: "", note: "" }); }, refresh: true });
  };
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Adjust wallet</Button>
      <Sheet open={open} onClose={() => setOpen(false)} side="dialog" title={`Wallet · ${name}`} description="Every change is recorded in their wallet history."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></div>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Action" htmlFor="wa-d"><Select id="wa-d" value={f.dir} onChange={(e) => setF({ ...f, dir: e.target.value })}><option value="add">Add money</option><option value="take">Take money</option></Select></Field>
            <Field label="Amount (₹)" htmlFor="wa-a"><Input id="wa-a" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, "") })} /></Field>
          </div>
          <Field label="Reason" htmlFor="wa-n" hint="Shown in the customer's history."><Input id="wa-n" value={f.note} maxLength={120} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        </div>
      </Sheet>
    </>
  );
}
