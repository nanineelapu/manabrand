import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminDashboard, getNotifications } from "@/lib/data";

/**
 * (console) route group: everything in /admin EXCEPT /admin/login, which has its own bare layout.
 * Phase 7: this is where the Supabase session + role check ("admin") will live.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [notifications, d] = await Promise.all([getNotifications(), getAdminDashboard()]);
  return (
    <AdminShell notifications={notifications} badges={{ orders: d.pendingOrders, sellers: d.pendingSellers, returns: d.openReturns, reviews: d.flaggedReviews }}>
      {children}
    </AdminShell>
  );
}
