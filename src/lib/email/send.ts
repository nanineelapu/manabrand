import "server-only";
import type { Mail } from "./templates";

/**
 * Sends email through Resend (https://resend.com). Needs two env vars:
 *   RESEND_API_KEY   — an API key ("Sending access") from the Resend dashboard
 *   EMAIL_FROM       — e.g. ManaBrand <care@manabrand.in>  (the domain must be verified in Resend)
 * Optional: SUPPORT_EMAIL — the inbox that receives contact-form messages (defaults to care@manabrand.in).
 * Without a key, mail is only logged to the server console (so local development never sends anything).
 * Never throws: a failed email must not break an order or a sign-up.
 */
export const SUPPORT_EMAIL = () => process.env.SUPPORT_EMAIL ?? "care@manabrand.in";
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export async function sendEmail(o: { to: string | string[]; replyTo?: string } & Mail): Promise<{ ok: boolean; dev?: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] to=${[o.to].flat().join(",")} subject="${o.subject}"`);
    return { ok: true, dev: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "ManaBrand <care@manabrand.in>", to: o.to, subject: o.subject, html: o.html, text: o.text,
        ...(o.replyTo ? { reply_to: o.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[email] Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return { ok: res.ok };
  } catch (e) {
    console.error("[email] send failed:", e instanceof Error ? e.message : e);
    return { ok: false };
  }
}
