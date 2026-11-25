"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { deleteAddress, saveAddress } from "@/lib/actions/store";
import { toast } from "@/lib/stores";
import type { Address } from "@/types";
import { AddressForm } from "./address-form";

export function AddressesManager({ initial }: { initial: Address[] }) {
  const [list, setList] = useState(initial);
  const [edit, setEdit] = useState<Partial<Address> | null>(null);
  const [del, setDel] = useState<Address | null>(null);

  const save = async (a: Address) => {
    const isEditing = Boolean(edit?.id);
    const tempId = isEditing ? a.id : `a${Date.now()}`;
    const optimistic: Address = { ...a, id: tempId };

    // Instant UI feedback: close modal and update state in 0ms!
    setEdit(null);
    setList((prev) => {
      const base = optimistic.isDefault ? prev.map((x) => ({ ...x, isDefault: false })) : prev;
      return isEditing
        ? base.map((x) => (x.id === a.id ? optimistic : x))
        : [optimistic, ...base];
    });
    toast.success("Address saved");

    // Persist in background
    try {
      const r = await saveAddress({ ...a, id: isEditing ? a.id : undefined });
      if (r.ok && r.id && !isEditing) {
        setList((prev) => prev.map((x) => (x.id === tempId ? { ...x, id: r.id } : x)));
      } else if (!r.ok && !r.demo) {
        setList((prev) => (isEditing ? prev.map((x) => (x.id === a.id ? (edit as Address) : x)) : prev.filter((x) => x.id !== tempId)));
        toast.error(r.error);
      }
    } catch {
      toast.error("Could not save address. Please try again.");
    }
  };

  const remove = async (addressToRemove: Address) => {
    setDel(null);
    // Instant optimistic removal
    setList((l) => l.filter((x) => x.id !== addressToRemove.id));
    toast.success("Address removed");
    try {
      const r = await deleteAddress(addressToRemove.id);
      if (!r.ok && !r.demo) {
        setList((l) => [...l, addressToRemove]);
        toast.error(r.error);
      }
    } catch {
      setList((l) => [...l, addressToRemove]);
      toast.error("Could not remove address");
    }
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
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEdit(a)}><Pencil className="size-3.5" /> Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => setDel(a)} className="rounded-full text-danger hover:bg-danger-bg"><Trash2 className="size-3.5" /> Remove</Button>
            </div>
          </article>
        ))}
        <button onClick={() => setEdit({})} className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong text-sm font-medium text-muted transition-colors hover:bg-bg-subtle hover:text-fg">
          <Plus className="size-6" /> Add a new address
        </button>
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} side="dialog" title={edit?.id ? "Edit address" : "Add address"}>
        {edit && <AddressForm initial={edit} onSave={save} onCancel={() => setEdit(null)} />}
      </Sheet>
      <Sheet open={!!del} onClose={() => setDel(null)} side="dialog" title="Remove this address?" description={del ? `${del.line1}, ${del.city}` : ""}
        footer={<div className="grid grid-cols-2 gap-2.5"><Button variant="outline" className="rounded-full" onClick={() => setDel(null)}>Keep</Button><Button variant="danger" className="rounded-full" onClick={() => del && remove(del)}>Remove</Button></div>}>
        <p className="text-sm text-muted">This can’t be undone.</p>
      </Sheet>
    </>
  );
}
