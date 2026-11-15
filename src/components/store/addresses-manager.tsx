"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { deleteAddress, saveAddress } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";
import type { Address } from "@/types";
import { AddressForm } from "./address-form";

export function AddressesManager({ initial }: { initial: Address[] }) {
  const [list, setList] = useState(initial);
  const [edit, setEdit] = useState<Partial<Address> | null>(null);
  const [del, setDel] = useState<Address | null>(null);

  const { act, busy } = useAct();
  const save = async (a: Address) => {
    const applyLocal = (saved: Address) => {
      setList((l) => {
        const base = saved.isDefault ? l.map((x) => ({ ...x, isDefault: false })) : l;
        return base.some((x) => x.id === saved.id) ? base.map((x) => (x.id === saved.id ? saved : x)) : [...base, saved];
      });
      setEdit(null);
    };
    await act(() => saveAddress({ ...a, id: edit?.id ? a.id : undefined }), { success: "Address saved", onOk: (r) => applyLocal("id" in r && r.id ? { ...a, id: r.id as string } : a), onDemo: () => applyLocal(a), refresh: false });
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <article key={a.id} className="flex flex-col rounded-card border border-line bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-bg-subtle"><MapPin className="size-[18px]" /></span>
              <span className="text-sm font-semibold">{a.label}</span>
              {a.isDefault && <Badge tone="success">Default</Badge>}
            </div>
            <p className="mt-3 text-sm font-medium">{a.name}</p>
            <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} – {a.pincode}<br />Mobile: {a.phone}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEdit(a)}><Pencil className="size-3.5" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => setDel(a)} className="text-danger hover:bg-danger-bg"><Trash2 className="size-3.5" /> Remove</Button>
            </div>
          </article>
        ))}
        <button onClick={() => setEdit({})} className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line-strong text-sm font-medium text-muted transition-colors hover:bg-bg-subtle hover:text-fg">
          <Plus className="size-6" /> Add a new address
        </button>
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} side="dialog" title={edit?.id ? "Edit address" : "Add address"}>
        {edit && <AddressForm initial={edit} onSave={save} onCancel={() => setEdit(null)} />}
      </Sheet>
      <Sheet open={!!del} onClose={() => setDel(null)} side="dialog" title="Remove this address?" description={del ? `${del.line1}, ${del.city}` : ""}
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" onClick={() => setDel(null)}>Keep</Button><Button variant="danger" loading={busy} onClick={() => act(() => deleteAddress(del!.id), { success: "Address removed", onOk: () => { setList((l) => l.filter((x) => x.id !== del!.id)); setDel(null); }, refresh: false })}>Remove</Button></div>}>
        <p className="text-sm text-muted">This can’t be undone.</p>
      </Sheet>
    </>
  );
}
