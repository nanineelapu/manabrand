import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * 1) Keeps the Supabase session fresh on every request.
 * 2) Fast route guards (the real authorisation is still RLS + server checks).
 * Demo mode (no Supabase keys): does nothing, so the mock storefront keeps working.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined; // set only by our server
  const path = request.nextUrl.pathname;
  const go = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to; url.search = "";
    if (to.endsWith("/login")) url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  };

  const staffPublic = ["/admin/login", "/seller/login", "/seller/register"];
  // exact-segment match: "/seller/..." is the seller portal, but "/sellers/<store>" is a PUBLIC storefront page
  const inArea = (area: string) => path === area || path.startsWith(area + "/");
  if (inArea("/admin") && !staffPublic.includes(path) && role !== "admin") return go("/admin/login");
  if (inArea("/seller") && !staffPublic.includes(path) && role !== "seller") return go("/seller/login");
  if ((path.startsWith("/account") || path === "/reset-pin") && !user) return go(path === "/reset-pin" ? "/forgot-password" : "/login");
  if ((path === "/login" || path === "/register") && role === "customer") return go("/account");

  return response;
}

export const config = {
  matcher: ["/((?!studio|api/revalidate|_next/static|_next/image|favicon/|logo\\.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|webmanifest)$).*)"],
};
