import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface SessionProfile {
  id: string; role: "customer" | "seller" | "admin"; name: string; email: string; phone: string | null;
  tier: string; joined: string;
}

/** The signed-in user's profile, or null (also null in demo mode when Supabase isn't configured). */
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); // validated against the Auth server, not just the cookie
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id, role, full_name, email, phone, tier, created_at").eq("id", user.id).maybeSingle();
  if (!data) return null;
  return { id: data.id, role: data.role, name: data.full_name, email: data.email, phone: data.phone, tier: data.tier, joined: data.created_at };
});
