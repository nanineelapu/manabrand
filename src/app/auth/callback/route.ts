import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

/** Landing point for the emailed PIN-reset link: swaps the one-time code for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), "/reset-pin");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/forgot-password?expired=1`);
}
