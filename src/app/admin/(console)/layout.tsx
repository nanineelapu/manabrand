import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminDashboard, getNotifications } from "@/lib/data";
import { getSessionProfile } from "@/lib/auth/session";

/**
 * (console) route group: everything in /admin EXCEPT /admin/login, which has its own bare layout.
 * Phase 7: this is where the Supabase session + role check ("admin") will live.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [notifications, d, me] = await Promise.all([getNotifications(), getAdminDashboard(), getSessionProfile()]);
  return (
    <AdminShell user={me ? { name: me.name, role: "Administrator" } : undefined} notifications={notifications} badges={{ orders: d.pendingOrders, sellers: d.pendingSellers, returns: d.openReturns, reviews: d.flaggedReviews }}>
      {children}
    </AdminShell>
  );
}
