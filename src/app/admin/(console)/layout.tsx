import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminBadgeCounts, getNotifications } from "@/lib/data";
import { getSessionProfile } from "@/lib/auth/session";

/**
 * (console) route group: everything in /admin EXCEPT /admin/login, which has its own bare layout.
 * Phase 7: this is where the Supabase session + role check ("admin") will live.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [notifications, badges, me] = await Promise.all([getNotifications(), getAdminBadgeCounts(), getSessionProfile()]);
  return (
    <AdminShell user={me ? { name: me.name, role: "Administrator" } : undefined} notifications={notifications} badges={badges}>
      {children}
    </AdminShell>
  );
}
