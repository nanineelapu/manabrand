/**
 * Turns "Supabase refused to create the account" into a message a shopper can act on, without leaking internals.
 * The short ref at the end (e.g. "ref: unexpected_failure") lets us find the cause quickly in the Vercel logs.
 */
export function signUpErrorMessage(error: { message?: string; status?: number; code?: string } | null | undefined): string {
  const msg = error?.message ?? "";
  const ref = error?.code || (error?.status ? String(error.status) : "");
  if (/already|registered|duplicate|unique/i.test(msg)) return "An account with these details already exists.";
  if (/database error/i.test(msg)) return "Sign-up isn’t fully set up on our side yet. Please try again a little later, or message us on WhatsApp.";
  if (error?.status === 401 || error?.status === 403 || /not allowed|invalid api key|invalid jwt|jwt/i.test(msg))
    return "Sign-up is temporarily unavailable on our side (a server setting needs fixing). Please try again later, or message us on WhatsApp.";
  if (error?.status === 429 || /rate limit/i.test(msg)) return "Too many attempts. Please wait a few minutes and try again.";
  if (/invalid.*email|email.*invalid/i.test(msg)) return "That email address wasn’t accepted. Please check it or use another one.";
  return `We couldn’t create your account. Please try again.${ref ? ` (ref: ${ref})` : ""}`;
}
