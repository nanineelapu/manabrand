"use client";

import { useState } from "react";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { addTeamMember, removeTeamMember } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { formatDate } from "@/lib/utils";

interface Member { id: string; name: string; email: string; role: string; since: string }
const ROLES = ["Super admin", "Operations", "Support", "Marketing"];

/** Admin → Team: who can sign in to this panel. Add a teammate (email + password) or remove access. */
export function TeamManager({ members, meId }: { members: Member[]; meId?: string }) {
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Member | null>(null);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "Operations" });
  const [err, setErr] = useState("");
  const { act, busy } = useAct();

  const save = () => {
    if (f.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(f.email)) { setErr("Enter a name and a valid email."); return; }
    if (f.password.length < 10 || !/[a-z]/i.test(f.password) || !/\d/.test(f.password)) { setErr("Password: at least 10 characters, with letters and numbers."); return; }
    setErr("");
    act(() => addTeamMember(f), { success: "Teammate added", onOk: () => { setOpen(false); setF({ name: "", email: "", password: "", role: "Operations" }); }, refresh: true });
  };

  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add teammate</Button></div>
      <ul className="divide-y divide-line rounded-card border border-line bg-card shadow-card">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3.5 px-4 py-3.5 md:px-5">
            <Avatar name={m.name} size={40} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.name}{m.id === meId && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}</p><p className="truncate text-[13px] text-muted">{m.email} · since {formatDate(m.since)}</p></div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-subtle px-3 py-1 text-xs font-semibold"><ShieldCheck className="size-3.5" />{m.role}</span>
            {m.id !== meId && <button aria-label={`Remove ${m.name}`} onClick={() => setDel(m)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger-bg hover:text-danger"><Trash2 className="size-4" /></button>}
          </li>
        ))}
      </ul>

      <Sheet open={open} onClose={() => setOpen(false)} side="dialog" title="Add a teammate" description="They sign in at /admin/login with this email and password."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={save}>Add</Button></div>}>
        <div className="space-y-4">
          <Field label="Full name" htmlFor="tm-n"><Input id="tm-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email" htmlFor="tm-e"><Input id="tm-e" type="email" autoComplete="off" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Temporary password" htmlFor="tm-p" hint="At least 10 characters, letters and numbers. Ask them to change it after signing in."><Input id="tm-p" type="text" autoComplete="off" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <Field label="Role" htmlFor="tm-r"><Select id="tm-r" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        </div>
      </Sheet>

      <Sheet open={!!del} onClose={() => setDel(null)} side="dialog" title={`Remove ${del?.name}?`} description="Their admin account is deleted and they can no longer sign in."
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={() => del && act(() => removeTeamMember(del.id), { success: "Access removed", onOk: () => setDel(null), refresh: true })}>Remove</Button></div>}>
        <p className="text-sm text-muted">{del?.email}</p>
      </Sheet>
    </>
  );
}
