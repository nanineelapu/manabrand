"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";

export const INDIAN_STATES = ["Andhra Pradesh", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Chandigarh"];

type Errors = Partial<Record<"name" | "phone" | "line1" | "city" | "state" | "pincode", string>>;

export function validateAddress(a: Partial<Address>): Errors {
  const e: Errors = {};
  if (!a.name?.trim()) e.name = "Enter the recipient’s full name";
  if (!/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test((a.phone ?? "").trim())) e.phone = "Enter a valid 10-digit mobile number";
  if (!a.line1?.trim()) e.line1 = "Enter your flat, house no. and street";
  if (!a.city?.trim()) e.city = "Enter your city";
  if (!a.state) e.state = "Select a state";
  if (!/^[1-9]\d{5}$/.test(a.pincode ?? "")) e.pincode = "Enter a valid 6-digit pincode";
  return e;
}

export function AddressForm({
  initial, onSave, onCancel, submitLabel = "Save address",
}: { initial?: Partial<Address>; onSave: (a: Address) => void; onCancel?: () => void; submitLabel?: string }) {
  const [a, setA] = useState<Partial<Address>>({ label: "Home", isDefault: false, ...initial });
  const [errors, setErrors] = useState<Errors>({});
  const set = <K extends keyof Address>(k: K, v: Address[K]) => { setA((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  return (
    <form noValidate className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const errs = validateAddress(a); setErrors(errs);
      if (Object.keys(errs).length) return;
      onSave({ id: a.id ?? `a${Date.now()}`, label: a.label ?? "Home", name: a.name!.trim(), phone: a.phone!.trim(), line1: a.line1!.trim(), line2: a.line2?.trim(), city: a.city!.trim(), state: a.state!, pincode: a.pincode!, isDefault: !!a.isDefault });
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="ad-name" error={errors.name}><Input id="ad-name" autoComplete="name" value={a.name ?? ""} onChange={(e) => set("name", e.target.value)} invalid={!!errors.name} /></Field>
        <Field label="Mobile number" htmlFor="ad-phone" error={errors.phone}><Input id="ad-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={a.phone ?? ""} onChange={(e) => set("phone", e.target.value)} invalid={!!errors.phone} /></Field>
      </div>
      <Field label="Flat, house no., building" htmlFor="ad-l1" error={errors.line1}><Input id="ad-l1" autoComplete="address-line1" value={a.line1 ?? ""} onChange={(e) => set("line1", e.target.value)} invalid={!!errors.line1} /></Field>
      <Field label="Area, street, landmark" htmlFor="ad-l2" optional><Input id="ad-l2" autoComplete="address-line2" value={a.line2 ?? ""} onChange={(e) => set("line2", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pincode" htmlFor="ad-pin" error={errors.pincode}><Input id="ad-pin" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={a.pincode ?? ""} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} invalid={!!errors.pincode} /></Field>
        <Field label="City" htmlFor="ad-city" error={errors.city}><Input id="ad-city" autoComplete="address-level2" value={a.city ?? ""} onChange={(e) => set("city", e.target.value)} invalid={!!errors.city} /></Field>
      </div>
      <Field label="State" htmlFor="ad-state" error={errors.state}>
        <Select id="ad-state" value={a.state ?? ""} onChange={(e) => set("state", e.target.value)} invalid={!!errors.state}>
          <option value="" disabled>Select state</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </Field>
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Address type</legend>
        <div className="flex gap-2">
          {(["Home", "Work", "Other"] as const).map((l) => (
            <button type="button" key={l} aria-pressed={a.label === l} onClick={() => set("label", l)}
              className={cn("h-10 rounded-full border px-5 text-sm font-medium", a.label === l ? "border-primary bg-primary text-primary-fg" : "border-line-strong bg-card hover:bg-bg-subtle")}>{l}</button>
          ))}
        </div>
      </fieldset>
      <Checkbox checked={!!a.isDefault} onChange={(v) => set("isDefault", v)} label="Make this my default address" />
      <div className="flex gap-2.5 pt-1">
        {onCancel && <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" className="flex-1">{submitLabel}</Button>
      </div>
    </form>
  );
}
