"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { completeReset, loginStaff, loginWithPhonePin, registerCustomer, requestPinReset, type AuthResult } from "@/lib/auth/actions";
import { emailError, nameError, passwordError, phoneError, pinError } from "@/lib/auth/validation";
import { toast } from "@/lib/stores";

/* ---------------------------------------------------------------- helpers */
function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 border border-danger/30 bg-danger-bg px-3.5 py-3 text-sm text-danger">
      <AlertCircle className="mt-0.5 size-4 shrink-0" /> {message}
    </p>
  );
}

/** 4-digit PIN / password field with show-hide. Digits only for PINs. */
function SecretField({
  id, label, value, onChange, error, hint, pin = true, autoComplete = "current-password",
}: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; pin?: boolean; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <Input
        id={id} type={show ? "text" : "password"} autoComplete={autoComplete} value={value} invalid={!!error}
        inputMode={pin ? "numeric" : undefined} maxLength={pin ? 4 : 128} placeholder={pin ? "••••" : undefined}
        className={pin ? "text-lg tracking-[0.5em]" : undefined}
        onChange={(e) => onChange(pin ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value)}
        trailing={
          <button type="button" aria-label={show ? "Hide" : "Show"} onClick={() => setShow(!show)} className="grid size-9 place-items-center text-subtle hover:bg-bg-subtle">
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        }
      />
    </Field>
  );
}

function useAuthSubmit() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [fields, setFields] = useState<Record<string, string>>({});
  const run = (fn: () => Promise<AuthResult>) => {
    setError(undefined); setFields({});
    start(async () => {
      const res = await fn();
      if (res.ok) { toast.success("Welcome!"); router.replace(res.redirectTo); router.refresh(); }
      else { setError(res.error); setFields(res.fieldErrors ?? {}); }
    });
  };
  return { pending, error, fields, setFields, run, setError };
}

/* ======================================================================= LOGIN */
export function LoginForm({
  mode = "customer", area = "admin", next, forgotHref = "/forgot-password",
}: { mode?: "customer" | "staff"; area?: "admin" | "seller"; next?: string; forgotHref?: string }) {
  const { pending, error, fields, setFields, run } = useAuthSubmit();
  const [phone, setPhone] = useState(""); const [pin, setPin] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");

  if (mode === "staff") {
    return (
      <form noValidate className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        const f: Record<string, string> = {};
        const em = emailError(email); if (em) f.email = em;
        if (!password) f.password = "Enter your password";
        setFields(f); if (Object.keys(f).length) return;
        run(() => loginStaff({ email, password, area, next }));
      }}>
        <FormError message={error} />
        <Field label="Work email" htmlFor="em" error={fields.email}><Input id="em" type="email" inputMode="email" autoComplete="username" leading={<Mail className="size-4" />} value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!fields.email} /></Field>
        <SecretField id="pw" label="Password" pin={false} value={password} onChange={setPassword} error={fields.password} />
        <div className="text-right"><Link href={forgotHref} className="text-sm font-medium underline underline-offset-4">Forgot password?</Link></div>
        <Button type="submit" size="lg" full loading={pending}>Sign in</Button>
      </form>
    );
  }

  return (
    <form noValidate className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const f: Record<string, string> = {};
      const pe = phoneError(phone); if (pe) f.phone = pe;
      if (!/^\d{4}$/.test(pin)) f.pin = "Enter your 4-digit PIN";
      setFields(f); if (Object.keys(f).length) return;
      run(() => loginWithPhonePin({ phone, pin, next }));
    }}>
      <FormError message={error} />
      <Field label="Mobile number" htmlFor="ph" error={fields.phone}>
        <Input id="ph" type="tel" inputMode="tel" autoComplete="username" placeholder="98765 43210" maxLength={14}
          leading={<span className="text-sm font-medium text-fg">+91</span>} className="pl-14" value={phone} onChange={(e) => setPhone(e.target.value)} invalid={!!fields.phone} />
      </Field>
      <SecretField id="pin" label="4-digit PIN" value={pin} onChange={setPin} error={fields.pin} />
      <div className="text-right"><Link href={forgotHref} className="text-sm font-medium underline underline-offset-4">Forgot PIN?</Link></div>
      <Button type="submit" size="lg" full loading={pending}>Sign in</Button>
    </form>
  );
}

/* ==================================================================== REGISTER */
export function RegisterForm({ next }: { next?: string }) {
  const { pending, error, fields, setFields, run } = useAuthSubmit();
  const [v, setV] = useState({ name: "", phone: "", email: "", pin: "", confirmPin: "", terms: false });
  const set = (k: keyof typeof v, val: string | boolean) => { setV((p) => ({ ...p, [k]: val })); setFields((e) => ({ ...e, [k]: "" })); };

  return (
    <form noValidate className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const f: Record<string, string> = {};
      const n = nameError(v.name); if (n) f.name = n;
      const p = phoneError(v.phone); if (p) f.phone = p;
      const em = emailError(v.email); if (em) f.email = em;
      const pe = pinError(v.pin, v.phone); if (pe) f.pin = pe;
      else if (v.pin !== v.confirmPin) f.confirmPin = "PINs don’t match";
      if (!v.terms) f.terms = "Please accept the terms to continue";
      setFields(f); if (Object.keys(f).length) return;
      run(() => registerCustomer({ name: v.name, phone: v.phone, email: v.email, pin: v.pin, confirmPin: v.confirmPin, next }));
    }}>
      <FormError message={error} />
      <Field label="Full name" htmlFor="rn" error={fields.name}><Input id="rn" autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} invalid={!!fields.name} /></Field>
      <Field label="Mobile number" htmlFor="rp" error={fields.phone} hint="You’ll sign in with this number.">
        <Input id="rp" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" maxLength={14}
          leading={<span className="text-sm font-medium text-fg">+91</span>} className="pl-14" value={v.phone} onChange={(e) => set("phone", e.target.value)} invalid={!!fields.phone} />
      </Field>
      <Field label="Email address" htmlFor="re" error={fields.email} hint="We send order updates, receipts and your PIN-reset link here.">
        <Input id="re" type="email" inputMode="email" autoComplete="email" leading={<Mail className="size-4" />} value={v.email} onChange={(e) => set("email", e.target.value)} invalid={!!fields.email} />
      </Field>
      <SecretField id="rpin" label="Create a 4-digit PIN" autoComplete="new-password" value={v.pin} onChange={(x) => set("pin", x)} error={fields.pin} hint="Avoid birth years, 1234 or repeated digits." />
      <SecretField id="rpin2" label="Confirm PIN" autoComplete="new-password" value={v.confirmPin} onChange={(x) => set("confirmPin", x)} error={fields.confirmPin} />
      <p className="flex items-start gap-2 bg-accent-soft px-3.5 py-3 text-[13px] text-accent-soft-fg"><ShieldCheck className="mt-0.5 size-4 shrink-0" /> Your PIN is stored securely and can never be viewed — not even by us. We will never ask for it.</p>
      <div>
        <Checkbox checked={v.terms} onChange={(b) => set("terms", b)} label={<>I agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy policy</Link></>} />
        {fields.terms && <p role="alert" className="mt-1 text-xs text-danger">{fields.terms}</p>}
      </div>
      <Button type="submit" size="lg" full loading={pending}>Create account</Button>
    </form>
  );
}

/* ====================================================================== FORGOT */
export function ForgotForm({ backHref = "/login", expired, staff }: { backHref?: string; expired?: boolean; staff?: boolean }) {
  const [email, setEmail] = useState(""); const [err, setErr] = useState(expired ? "That reset link has expired. Request a new one below." : "");
  const [sent, setSent] = useState(false); const [pending, start] = useTransition();

  if (sent) return (
    <div className="animate-fade-in border border-line bg-card p-6 text-center shadow-card">
      <span className="mx-auto grid size-14 place-items-center bg-success-bg"><ShieldCheck className="size-7 text-success" /></span>
      <h2 className="mt-4 text-lg font-semibold">Check your inbox</h2>
      <p className="mt-1 text-sm text-muted">If an account uses <b className="text-fg">{email}</b>, we’ve sent a link to {staff ? "reset your password" : "set a new PIN"}. It expires soon.</p>
      <Button href={backHref} variant="outline" className="mt-5" full>Back to sign in</Button>
    </div>
  );
  return (
    <form noValidate className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const m = emailError(email); if (m) { setErr(m); return; }
      setErr("");
      start(async () => { const r = await requestPinReset(email); if (r.ok) setSent(true); else setErr(r.error ?? "Something went wrong"); });
    }}>
      <Field label="Email on your account" htmlFor="fe" error={err} hint={staff ? undefined : "Use the email you registered with."}>
        <Input id="fe" type="email" inputMode="email" autoComplete="email" leading={<Lock className="size-4" />} value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} invalid={!!err} />
      </Field>
      <Button type="submit" size="lg" full loading={pending}>Send reset link</Button>
      <Link href={backHref} className="block text-center text-sm font-medium underline underline-offset-4">Back to sign in</Link>
    </form>
  );
}

/* ================================================================ RESET (set new) */
export function ResetForm({ kind }: { kind: "pin" | "password" }) {
  const { pending, error, fields, setFields, run } = useAuthSubmit();
  const [secret, setSecret] = useState(""); const [confirm, setConfirm] = useState("");
  const isPin = kind === "pin";
  return (
    <form noValidate className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const f: Record<string, string> = {};
      const se = isPin ? pinError(secret) : passwordError(secret); if (se) f.secret = se;
      else if (secret !== confirm) f.confirm = isPin ? "PINs don’t match" : "Passwords don’t match";
      setFields(f); if (Object.keys(f).length) return;
      run(() => completeReset({ secret, confirm }));
    }}>
      <FormError message={error} />
      <SecretField id="ns" label={isPin ? "New 4-digit PIN" : "New password"} pin={isPin} autoComplete="new-password" value={secret} onChange={setSecret} error={fields.secret} />
      <SecretField id="nc" label={isPin ? "Confirm new PIN" : "Confirm new password"} pin={isPin} autoComplete="new-password" value={confirm} onChange={setConfirm} error={fields.confirm} />
      <Button type="submit" size="lg" full loading={pending}>{isPin ? "Save new PIN" : "Save new password"}</Button>
    </form>
  );
}
