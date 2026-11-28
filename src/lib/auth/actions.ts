"use server";

import { signUpErrorMessage } from "@/lib/auth/errors";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";
import { isSupabaseConfigured, siteUrl } from "@/lib/supabase/env";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { WELCOME_CREDIT } from "@/lib/wallet";
import { passwordFromPin } from "./pin";
import { clearFailures, lockoutStatus, recordAttempt, clientIp } from "./throttle";
import { emailError, nameError, normalizeEmail, normalizePhone, passwordError, phoneError, pinError, safeNext } from "./validation";

export type AuthResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const GENERIC_LOGIN_ERROR = "Incorrect mobile number or PIN.";
// shown to shoppers while the database isn't connected (owner: add the Supabase keys + PIN_PEPPER, see docs/SUPABASE_SETUP.md)
const NOT_CONFIGURED = "Accounts aren’t switched on yet — the store is still being set up. Please check back soon.";
const ready = () => isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) && Boolean(process.env.PIN_PEPPER?.trim());
const lockedMsg = (m: number) => `Too many attempts. Try again in ${m} minute${m === 1 ? "" : "s"}, or reset your PIN by email.`;

/* ============================================================== REGISTER */
export async function registerCustomer(input: {
  name: string; phone: string; email: string; pin: string; confirmPin: string; next?: string;
}): Promise<AuthResult> {
  if (!ready()) return { ok: false, error: NOT_CONFIGURED };

  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const fieldErrors: Record<string, string> = {};
  const nErr = nameError(input.name); if (nErr) fieldErrors.name = nErr;
  if (!phone) fieldErrors.phone = phoneError(input.phone)!;
  if (!email) fieldErrors.email = emailError(input.email)!;
  const pErr = pinError(input.pin, input.phone); if (pErr) fieldErrors.pin = pErr;
  if (!pErr && input.pin !== input.confirmPin) fieldErrors.confirmPin = "PINs don’t match";
  if (Object.keys(fieldErrors).length || !phone || !email) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };

  // Limit account creation per IP (5 / hour) so the endpoint can't be used for spam.
  const ipKey = `register:${(await clientIp()) ?? "unknown"}`;
  const lock = await lockoutStatus(ipKey, 5, 60);
  if (lock.locked) return { ok: false, error: "Too many sign-up attempts from this network. Please try again later." };
  await recordAttempt(ipKey, false);

  const admin = createAdminClient();
  const [{ data: byPhone }, { data: byEmail }] = await Promise.all([
    admin.from("profiles").select("id").eq("phone", phone).maybeSingle(),
    admin.from("profiles").select("id").eq("email", email).maybeSingle(),
  ]);
  if (byPhone) return { ok: false, error: "This mobile number is already registered. Please sign in.", fieldErrors: { phone: "Already registered" } };
  if (byEmail) return { ok: false, error: "This email is already in use. Try signing in, or use another email.", fieldErrors: { email: "Already in use" } };

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password: passwordFromPin(input.pin, phone),
    email_confirm: true, // sign-in works immediately; the reset link proves ownership of the inbox
    user_metadata: { full_name: input.name.trim(), phone },
    app_metadata: { provisioned_by: "mana-server", role: "customer" }, // server-only: a client can't forge this
  });
  if (error) {
    console.error("[register] could not create the account:", error.message, error.status ?? "");   // visible in Vercel → Logs
    return { ok: false, error: signUpErrorMessage(error) };
  }

  // The database trigger already grants the welcome credit; this is a safety net (one welcome row per customer is enforced by a unique index, so it can never double up)
  if (newUser?.user?.id) {
    try {
      await admin.from("wallet_transactions").insert({
        user_id: newUser.user.id,
        amount: WELCOME_CREDIT,
        kind: "welcome",
        note: "Welcome gift",
      });
    } catch {
      // Harmless: database trigger may have already inserted it, or table not yet migrated
    }
  }

  // sign in right away (sets the session cookies)
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: passwordFromPin(input.pin, phone) });
  if (signInError) return { ok: true, redirectTo: "/login" };

  const mail = welcomeEmail(input.name.trim(), siteUrl());
  void sendEmail({ to: email, ...mail });
  return { ok: true, redirectTo: safeNext(input.next, "/account") };
}

/* ======================================================== LOGIN: PHONE + PIN */
export async function loginWithPhonePin(input: { phone: string; pin: string; next?: string }): Promise<AuthResult> {
  if (!ready()) return { ok: false, error: NOT_CONFIGURED };

  const phone = normalizePhone(input.phone);
  if (!phone || !/^\d{4}$/.test(input.pin)) return { ok: false, error: GENERIC_LOGIN_ERROR };

  const lock = await lockoutStatus(phone);
  if (lock.locked) return { ok: false, error: lockedMsg(lock.minutesLeft) };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, email, role, status").eq("phone", phone).maybeSingle();

  // Same message for "no such number", "wrong PIN" and "not a shopper account" → no account enumeration.
  if (!profile || profile.role !== "customer") {
    await recordAttempt(phone, false);
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: profile.email, password: passwordFromPin(input.pin, phone) });
  if (error) {
    await recordAttempt(phone, false);
    const after = await lockoutStatus(phone);
    return { ok: false, error: after.locked ? lockedMsg(after.minutesLeft) : GENERIC_LOGIN_ERROR };
  }

  if (profile.status === "blocked") {
    await supabase.auth.signOut();
    return { ok: false, error: "Your account has been blocked. Please contact support." };
  }

  await clearFailures(phone);
  return { ok: true, redirectTo: safeNext(input.next, "/account") };
}

/* ================================================ LOGIN: STAFF (EMAIL + PASSWORD) */
export async function loginStaff(input: { email: string; password: string; area: "admin" | "seller"; next?: string }): Promise<AuthResult> {
  if (!ready()) return { ok: false, error: NOT_CONFIGURED };
  const GENERIC = "Incorrect email or password.";
  const email = normalizeEmail(input.email);
  if (!email || !input.password) return { ok: false, error: GENERIC };

  const id = `staff:${email}`;
  const lock = await lockoutStatus(id);
  if (lock.locked) return { ok: false, error: lockedMsg(lock.minutesLeft) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: input.password });
  if (error || !data.user) { await recordAttempt(id, false); return { ok: false, error: GENERIC }; }

  // Role gate: a valid account of the wrong kind is signed straight back out.
  const role = data.user.app_metadata?.role;
  let allowed = role === input.area;
  if (allowed && input.area === "admin") {
    const { data: m } = await createAdminClient().from("admin_members").select("user_id").eq("user_id", data.user.id).maybeSingle();
    allowed = Boolean(m);
  }
  if (!allowed) { await supabase.auth.signOut(); await recordAttempt(id, false); return { ok: false, error: GENERIC }; }

  await clearFailures(id);
  return { ok: true, redirectTo: safeNext(input.next, input.area === "admin" ? "/admin" : "/seller") };
}

/* ================================================================= SIGN OUT */
export async function signOutAction(area: "store" | "admin" | "seller" = "store") {
  if (isSupabaseConfigured()) await (await createClient()).auth.signOut();
  redirect(area === "admin" ? "/admin/login" : area === "seller" ? "/seller/login" : "/login");
}

/* ================================================== FORGOT PIN → EMAIL LINK */
export async function requestPinReset(emailRaw: string): Promise<{ ok: boolean; error?: string }> {
  const email = normalizeEmail(emailRaw);
  if (!email) return { ok: false, error: emailError(emailRaw) ?? "Enter a valid email address" };
  if (!ready()) return { ok: false, error: NOT_CONFIGURED };

  // 3 requests / hour / email. When throttled we still answer "sent" so nothing is revealed.
  const id = `reset:${email}`;
  if (!(await lockoutStatus(id, 3, 60)).locked) {
    await recordAttempt(id, false);
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=/reset-pin` });
  }
  return { ok: true };
}

/** After the emailed link is opened the user has a short-lived session; they set a new PIN (or password for staff). */
export async function completeReset(input: { secret: string; confirm: string }): Promise<AuthResult> {
  if (!ready()) return { ok: false, error: NOT_CONFIGURED };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "This reset link has expired. Please request a new one." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role, phone").eq("id", user.id).single();
  if (!profile) return { ok: false, error: "Account not found." };

  let password: string; let identifier: string; let home = "/account";
  if (profile.role === "customer" && profile.phone) {
    const err = pinError(input.secret, profile.phone);
    if (err) return { ok: false, error: err, fieldErrors: { secret: err } };
    password = passwordFromPin(input.secret, profile.phone);
    identifier = profile.phone;
  } else {
    const err = passwordError(input.secret);
    if (err) return { ok: false, error: err, fieldErrors: { secret: err } };
    password = input.secret;
    identifier = `staff:${user.email}`;
    home = profile.role === "admin" ? "/admin" : "/seller";
  }
  if (input.secret !== input.confirm) return { ok: false, error: "Entries don’t match", fieldErrors: { confirm: "Entries don’t match" } };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: "We couldn’t update it. Please request a new link." };

  await admin.from("profiles").update({ pin_changed_at: new Date().toISOString() }).eq("id", user.id);
  await clearFailures(identifier);
  return { ok: true, redirectTo: home };
}
