"use client";

import { useState } from "react";
import { Ban, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input, Textarea } from "@/components/ui/form";
import { emailCustomer, setCustomerBlocked } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";

export function CustomerActions({ userId, name, initialBlocked }: { userId: string; name: string; initialBlocked: boolean }) {
  const { act, busy } = useAct();
  const [blocked, setBlocked] = useState(initialBlocked);
  const [confirm, setConfirm] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [mail, setMail] = useState({ subject: "", message: "" });
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {blocked && <StatusBadge status="blocked" />}
        <Button variant="outline" size="sm" onClick={() => setMailOpen(true)}><Mail className="size-4" /> Email</Button>
        <Button variant={blocked ? "primary" : "outline"} size="sm" className={blocked ? "" : "text-danger"} onClick={() => (blocked ? act(() => setCustomerBlocked(userId, false), { success: `${name} unblocked`, onOk: () => setBlocked(false) }) : setConfirm(true))}><Ban className="size-4" /> {blocked ? "Unblock" : "Block"}</Button>
      </div>
      <Sheet open={confirm} onClose={() => setConfirm(false)} side="dialog" title={`Block ${name}?`} description="They won’t be able to place new orders. Existing orders are unaffected."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" loading={busy} onClick={() => act(() => setCustomerBlocked(userId, true), { success: `${name} blocked`, onOk: () => { setBlocked(true); setConfirm(false); } })}>Block customer</Button></div>}><span /></Sheet>
      <Sheet open={mailOpen} onClose={() => setMailOpen(false)} side="dialog" title={`Email ${name}`} description="Sent from ManaBrand. Replies go to your support inbox."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setMailOpen(false)}>Cancel</Button><Button loading={busy} onClick={() => act(() => emailCustomer(userId, mail.subject, mail.message), { success: "Email sent", onOk: () => { setMailOpen(false); setMail({ subject: "", message: "" }); }, refresh: false })}>Send email</Button></div>}>
        <div className="space-y-4">
          <Field label="Subject" htmlFor="em-s"><Input id="em-s" value={mail.subject} maxLength={120} onChange={(e) => setMail({ ...mail, subject: e.target.value })} /></Field>
          <Field label="Message" htmlFor="em-m"><Textarea id="em-m" rows={6} value={mail.message} maxLength={3000} onChange={(e) => setMail({ ...mail, message: e.target.value })} /></Field>
        </div>
      </Sheet>
    </>
  );
}
