import "server-only";

/**
 * Transactional email to the address the customer registered with.
 * Uses Resend's REST API when RESEND_API_KEY is set; otherwise logs (dev).
 * NEVER put a PIN or password in an email.
 * (PIN-reset mail is sent by Supabase Auth itself — customise its template in the dashboard.)
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] to=${to} subject="${subject}"`);
    return { ok: true as const, dev: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "ManaBrand <care@manabrand.in>", to, subject, html }),
    });
    return { ok: res.ok as boolean };
  } catch {
    return { ok: false as const };
  }
}

export const welcomeEmail = (name: string, siteUrl: string) => ({
  subject: "Welcome to ManaBrand",
  html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
    <h2>Welcome, ${name.replace(/[<>&]/g, "")} 👋</h2>
    <p>Your ManaBrand account is ready. Sign in any time with your <b>mobile number and 6-digit PIN</b>.</p>
    <p>Order updates, receipts and PIN-reset links will be sent to this email address.</p>
    <p style="color:#666;font-size:13px">For your security we will never ask for your PIN by email, phone or chat.</p>
    <p><a href="${siteUrl}/shop" style="display:inline-block;background:#0d1f19;color:#fff;padding:12px 20px;text-decoration:none">Start shopping</a></p>
  </div>`,
});
