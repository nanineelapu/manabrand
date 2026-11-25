"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { AREA, NEARBY_PLACES, OUT_OF_AREA, inServiceArea } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";


type Errors = Partial<Record<"name" | "phone" | "line1" | "city" | "pincode", string>>;

export function validateAddress(a: Partial<Address>): Errors {
  const e: Errors = {};
  if (!a.name?.trim()) e.name = "Enter the recipient’s full name";
  if (!/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test((a.phone ?? "").trim())) e.phone = "Enter a valid 10-digit mobile number";
  if (!a.line1?.trim()) e.line1 = "Enter your flat, house no. and street";
  if (!a.city?.trim()) e.city = "Enter your town or village";
  if (!/^\d{6}$/.test(a.pincode ?? "")) e.pincode = "Enter a valid 6-digit pincode";
  else if (!inServiceArea(a.pincode!)) e.pincode = OUT_OF_AREA;
  return e;
}

export function AddressForm({
  initial, onSave, onCancel, submitLabel = "Save address",
}: { initial?: Partial<Address>; onSave: (a: Address) => void | Promise<void>; onCancel?: () => void; submitLabel?: string }) {
  const [a, setA] = useState<Partial<Address>>({ label: "Home", isDefault: false, city: AREA.town, pincode: AREA.pincode, ...initial });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Address>(k: K, v: Address[K]) => { setA((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  return (
    <form noValidate className="space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      if (saving) return; // Prevent multiple clicks / double submission
      const errs = validateAddress(a); setErrors(errs);
      if (Object.keys(errs).length) return;
      setSaving(true);
      try {
        await onSave({
          id: a.id ?? `a${Date.now()}`,
          label: a.label ?? "Home",
          name: a.name!.trim(),
          phone: a.phone!.trim(),
          line1: a.line1!.trim(),
          line2: a.line2?.trim(),
          city: a.city!.trim(),
          state: AREA.state,
          pincode: a.pincode!,
          isDefault: !!a.isDefault,
        });
      } finally {
        setSaving(false);
      }
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="ad-name" error={errors.name}><Input id="ad-name" autoComplete="name" value={a.name ?? ""} disabled={saving} onChange={(e) => set("name", e.target.value)} invalid={!!errors.name} /></Field>
        <Field label="Mobile number" htmlFor="ad-phone" error={errors.phone}><Input id="ad-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={a.phone ?? ""} disabled={saving} onChange={(e) => set("phone", e.target.value)} invalid={!!errors.phone} /></Field>
      </div>
      <Field label="Flat, house no., building" htmlFor="ad-l1" error={errors.line1}><Input id="ad-l1" autoComplete="address-line1" value={a.line1 ?? ""} disabled={saving} onChange={(e) => set("line1", e.target.value)} invalid={!!errors.line1} /></Field>
      <Field label="Area, street, landmark" htmlFor="ad-l2" optional hint="Village, ward or a landmark helps us find you."><Input id="ad-l2" autoComplete="address-line2" value={a.line2 ?? ""} disabled={saving} onChange={(e) => set("line2", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pincode" htmlFor="ad-pin" error={errors.pincode}><Input id="ad-pin" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={a.pincode ?? ""} disabled={saving} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} invalid={!!errors.pincode} /></Field>
        <Field label="Town / village" htmlFor="ad-city" error={errors.city}><Input id="ad-city" list="nearby-places" autoComplete="address-level2" value={a.city ?? ""} disabled={saving} onChange={(e) => set("city", e.target.value)} invalid={!!errors.city} /></Field>
      </div>
      <datalist id="nearby-places">{NEARBY_PLACES.map((p) => <option key={p} value={p} />)}</datalist>
      <p className="-mt-1 text-[13px] text-muted">Srikakulam district, {AREA.state}</p>
      <fieldset disabled={saving}>
        <legend className="mb-2 text-[13px] font-medium">Address type</legend>
        <div className="flex gap-2">
          {(["Home", "Work", "Other"] as const).map((l) => (
            <button type="button" key={l} aria-pressed={a.label === l} disabled={saving} onClick={() => set("label", l)}
              className={cn("h-10 rounded-full border px-5 text-sm font-medium disabled:opacity-50", a.label === l ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card hover:bg-bg-subtle")}>{l}</button>
          ))}
        </div>
      </fieldset>
      <Checkbox checked={!!a.isDefault} disabled={saving} onChange={(v) => set("isDefault", v)} label="Make this my default address" />
      <div className="flex gap-2.5 pt-1">
        {onCancel && <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">Cancel</Button>}
        <Button type="submit" loading={saving} disabled={saving} className="flex-1">{saving ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}
