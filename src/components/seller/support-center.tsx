"use client";

import { useState } from "react";
import { BookOpen, MessageCircle, Phone, Plus } from "lucide-react";
import { Panel } from "@/components/shared/blocks";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { createSupportTicket } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { toast } from "@/lib/stores";
import type { TicketRow } from "@/lib/data";

const faqs = [
  ["When do I get paid?", "Payout cycles close on the 15th and last day of the month. Funds reach your bank two working days later."],
  ["How is the marketplace fee calculated?", "12% of the selling price (incl. GST) on each delivered order. There are no listing or monthly fees."],
  ["Who arranges shipping?", "ManaBrand’s own delivery team collects from your pickup address and delivers in Ichapuram and nearby. Pack the order, print the label from the order page and hand it over."],
  ["What if a buyer returns an item?", "Approved returns are picked up free. If the item is damaged or not as described, you can raise a dispute with photos within 48 hours."],
  ["How do I improve my listing quality score?", "Add 4+ clear photos, accurate sizes and fabric details, and keep stock up to date."],
];

export function SupportCenter({ initial }: { initial: TicketRow[] }) {
  const { act, busy } = useAct();
  const [tickets, setTickets] = useState<TicketRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ topic: "", msg: "" }); const [errs, setErrs] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.topic) e.topic = "Choose a topic"; if (f.msg.trim().length < 10) e.msg = "Add a few details so we can help";
    setErrs(e); if (Object.keys(e).length) return;
    const local = () => { setTickets([{ id: `T-${2042 + tickets.length}`, subject: f.topic, status: "Open", at: "just now" }, ...tickets]); setOpen(false); setF({ topic: "", msg: "" }); };
    act(() => createSupportTicket({ topic: f.topic, message: f.msg }), { success: "Ticket created — we’ll reply within 4 hours", onOk: local, refresh: false });
  };

  return (
    <>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[[MessageCircle, "Chat with us", "Replies in ~10 min", () => toast.info("Chat opens here (demo)")], [Phone, "Call seller support", "+91 831 765 8309 · 9am–8pm", () => toast.info("Dialling… (demo)")], [BookOpen, "Seller guide", "Photos, pricing, shipping", () => toast.info("Guide opens here (demo)")]].map(([I, t, d, fn]) => {
          const Icon = I as typeof Phone;
          return <button key={t as string} onClick={fn as () => void} className="flex items-center gap-3.5 rounded-card border border-line bg-card p-4 text-left shadow-card transition-colors hover:bg-bg-subtle/60"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-100"><Icon className="size-5 text-gold-500" /></span><span><span className="block text-sm font-semibold">{t as string}</span><span className="text-xs text-muted">{d as string}</span></span></button>;
        })}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Common questions"><Accordion className="-mt-2 border-t-0">{faqs.map(([q, a]) => <AccordionItem key={q} title={q}>{a}</AccordionItem>)}</Accordion></Panel>
        <Panel title="Your tickets" action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> New</Button>} padded={false}>
          <ul className="divide-y divide-line">
            {tickets.map((t) => <li key={t.id} className="flex items-center gap-3 px-4 py-3.5 md:px-5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.subject}</p><p className="text-xs text-muted">{t.id} · {t.at}</p></div><Badge tone={t.status === "Resolved" ? "success" : t.status === "Open" ? "info" : "warning"} dot>{t.status}</Badge></li>)}
          </ul>
        </Panel>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} side="dialog" title="Raise a ticket" footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={submit}>Submit</Button></div>}>
        <div className="space-y-4">
          <Field label="Topic" htmlFor="tt" error={errs.topic}><Select id="tt" value={f.topic} onChange={(e) => { setF({ ...f, topic: e.target.value }); setErrs({}); }} invalid={!!errs.topic}><option value="">Select a topic</option>{["Payout query", "Order or shipping issue", "Return dispute", "Listing rejected", "Account & KYC", "Something else"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Describe the issue" htmlFor="tm" error={errs.msg}><Textarea id="tm" rows={4} value={f.msg} onChange={(e) => { setF({ ...f, msg: e.target.value }); setErrs({}); }} invalid={!!errs.msg} /></Field>
          <Field label="Order number" htmlFor="to" optional><Input id="to" placeholder="MB-10482" /></Field>
        </div>
      </Sheet>
    </>
  );
}
