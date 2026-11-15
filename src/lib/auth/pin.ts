import "server-only";
import { createHmac } from "node:crypto";

/**
 * The customer's PIN is never given to Supabase as-is. We derive the account password as
 *     HMAC-SHA256( PIN_PEPPER , "<phone>:<pin>" )
 * Supabase then bcrypt-hashes THAT value. Result:
 *  - A stolen database alone cannot be brute-forced offline (1M PINs would be trivial
 *    without the secret pepper, which lives only in server env).
 *  - Two people with the same PIN get different stored hashes (phone is mixed in).
 *  - The PIN itself is never stored or logged anywhere.
 * The same derivation MUST be used at register, login and reset.
 */
export function passwordFromPin(pin: string, phoneE164: string): string {
  const pepper = process.env.PIN_PEPPER;
  if (!pepper || pepper.length < 32 || pepper.startsWith("replace-with")) {
    throw new Error("PIN_PEPPER must be set to a random string of at least 32 characters");
  }
  return createHmac("sha256", pepper).update(`${phoneE164}:${pin}`).digest("hex");
}
