import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const ADMIN_ROLES = ["Super admin", "Operations", "Support", "Marketing"] as const;
export interface TeamMember { id: string; name: string; email: string; role: string; since: string }

/** Everyone who can sign in to the admin panel. (Called only from admin pages; uses the service-role client.) */
export async function getTeam(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured()) return [{ id: "demo", name: "Demo Admin", email: "admin@manabrand.co.in", role: "Super admin", since: new Date().toISOString() }];
  const db = createAdminClient();
  const { data: members } = await db.from("admin_members").select("user_id, admin_role, created_at").order("created_at");
  const ids = (members ?? []).map((m) => m.user_id as string);
  const { data: profiles } = ids.length ? await db.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p as { full_name: string; email: string }]));
  return (members ?? []).map((m) => ({
    id: m.user_id as string, name: byId.get(m.user_id as string)?.full_name ?? "—", email: byId.get(m.user_id as string)?.email ?? "—",
    role: m.admin_role as string, since: m.created_at as string,
  }));
}
