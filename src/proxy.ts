import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_OPTIONS } from "@/lib/supabase/cookies";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * 1) Keeps the Supabase session fresh on every request.
 * 2) Fast route guards (the real authorisation is still RLS + server checks).
 * Demo mode (no Supabase keys): does nothing, so the mock storefront keeps working.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  const path = request.nextUrl.pathname;
  const inArea = (area: string) => path === area || path.startsWith(area + "/");
  // pages that need a verified login (the guards below). Everything else is the public storefront.
  const guarded = inArea("/admin") || inArea("/seller") || inArea("/account") || path === "/checkout" || path === "/reset-pin" || path === "/login" || path === "/register";
  const hasLogin = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  // an anonymous visitor on a public page has nothing to check or refresh: skip Supabase completely (this is most traffic)
  if (!guarded && !hasLogin) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Guarded pages: verify the login with the Auth server (never trust the cookie alone).
  // Public pages for a signed-in visitor: just renew the session if it is about to expire — getSession() reads the cookie
  // and only calls the Auth server when the token actually needs refreshing, so browsing stays fast.
  if (!guarded) { await supabase.auth.getSession(); return response; }
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined; // set only by our server
  const go = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to; url.search = "";
    if (to.endsWith("/login")) url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    // keep any session cookies that were just refreshed, so a redirect never drops the login
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  const staffPublic = ["/admin/login", "/seller/login", "/seller/register"];
  // exact-segment match: "/seller/..." is the seller portal, but "/sellers/<store>" is a PUBLIC storefront page
  if (inArea("/admin") && !staffPublic.includes(path) && role !== "admin") return go("/admin/login");
  if (inArea("/seller") && !staffPublic.includes(path) && role !== "seller") return go("/seller/login");
  if ((path.startsWith("/account") || path === "/checkout" || path === "/reset-pin") && !user) return go(path === "/reset-pin" ? "/forgot-password" : "/login");
  if ((path === "/login" || path === "/register") && role === "customer") return go("/account");

  return response;
}

export const config = {
  matcher: ["/((?!studio|api/revalidate|sw\\.js|_next/static|_next/image|favicon/|logo\\.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|webmanifest)$).*)"],
};
