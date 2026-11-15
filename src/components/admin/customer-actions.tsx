"use client";

import { useState } from "react";
import { Ban, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status";
import { Sheet } from "@/components/ui/sheet";
import { setCustomerBlocked } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { toast } from "@/lib/stores";

export function CustomerActions({ userId, name, initialBlocked }: { userId: string; name: string; initialBlocked: boolean }) {
  const { act, busy } = useAct();
  const [blocked, setBlocked] = useState(initialBlocked);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {blocked && <StatusBadge status="blocked" />}
        <Button variant="outline" size="sm" onClick={() => toast.success(`Email composer opened for ${name} (demo)`)}><Mail className="size-4" /> Email</Button>
        <Button variant={blocked ? "primary" : "outline"} size="sm" className={blocked ? "" : "text-danger"} onClick={() => (blocked ? act(() => setCustomerBlocked(userId, false), { success: `${name} unblocked`, onOk: () => setBlocked(false) }) : setConfirm(true))}><Ban className="size-4" /> {blocked ? "Unblock" : "Block"}</Button>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} side="dialog" title={`Block ${name}?`} description="They won’t be able to place new orders. Existing orders are unaffected."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" loading={busy} onClick={() => act(() => setCustomerBlocked(userId, true), { success: `${name} blocked`, onOk: () => { setBlocked(true); setConfirm(false); } })}>Block customer</Button></div>}><span /></Sheet>
    </>
  );
}
