/**
 * Session cookie settings shared by the server client, the proxy and the browser client.
 * The login stays for a full year (the access token itself is short-lived and silently renewed with the refresh
 * token on every visit), so people are not signed out after a while. HttpOnly is NOT set because the browser
 * client must read the session; the cookie is still SameSite=Lax, and Secure on https.
 */
export const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
};
