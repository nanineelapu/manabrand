/**
 * Shared by the forms (instant feedback) AND the server actions (the real check).
 * Never trust the client copy — the server re-validates everything.
 */

/** Accepts 9876543210, 98765 43210, +91 98765-43210, 919876543210, 09876543210 → "+919876543210". */
export function normalizePhone(input: string): string | null {
  let d = input.replace(/[\s\-().]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  else if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

export const phoneError = (input: string) => (normalizePhone(input) ? null : "Enter a valid 10-digit Indian mobile number");

export function normalizeEmail(input: string): string | null {
  const e = input.trim().toLowerCase();
  return e.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e) ? e : null;
}

export const emailError = (input: string) => (normalizeEmail(input) ? null : "Enter a valid email address");

export const nameError = (input: string) => {
  const n = input.trim();
  return n.length >= 2 && n.length <= 80 ? null : "Enter your full name";
};

/**
 * PIN rules: exactly 4 digits, and not trivially guessable.
 * A 4-digit PIN has only 10,000 combinations, so we remove the most-guessed values and
 * (on the server) lock sign-in after a few wrong tries + mix in a secret pepper.
 */
export function pinError(pin: string, phone?: string): string | null {
  if (!/^\d{4}$/.test(pin)) return "Your PIN must be exactly 4 digits";
  if (/^(\d)\1{3}$/.test(pin)) return "Avoid repeated digits like 1111";
  const asc = "012345678901234567890", desc = "987654321098765432109";
  if (asc.includes(pin) || desc.includes(pin)) return "Avoid sequences like 1234";
  if (/^(\d\d)\1$/.test(pin)) return "Avoid repeating patterns like 1212";
  if (["1004", "2000", "2001", "1122", "1313", "6969", "0007", "2580", "1357", "2468", "1230", "0852", "7777", "4200", "1998", "1999", "2002", "2003"].includes(pin)) return "That PIN is too common — pick another";
  const p = phone ? normalizePhone(phone)?.slice(3) : undefined;
  if (p && p.includes(pin)) return "Your PIN must not be part of your phone number";
  return null;
}

/** Staff (admin/seller) use a real password, not a PIN. */
export function passwordError(pw: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters";
  if (!/[a-z]/i.test(pw) || !/\d/.test(pw)) return "Include letters and numbers";
  return null;
}

/** Only allow same-site relative redirects (prevents open-redirect after login). */
export function safeNext(next: string | null | undefined, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback;
}
