import { notifyAbandonedCart } from "@/lib/email/notify";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Runs once a day (see vercel.json). Finds carts that were left 3–72 hours ago with nothing bought since,
 * and sends each customer ONE reminder email. Vercel calls it with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get("authorization")?.trim() !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const now = Date.now();
  const { data: carts } = await db.from("carts").select("id, user_id, updated_at, cart_items(product_id, qty)")
    .is("reminded_at", null).lt("updated_at", new Date(now - 3 * 3600e3).toISOString()).gt("updated_at", new Date(now - 72 * 3600e3).toISOString()).limit(200);

  let sent = 0, skipped = 0;
  for (const c of (carts ?? []) as { id: string; user_id: string; updated_at: string; cart_items: { product_id: string; qty: number }[] }[]) {
    if (!c.cart_items?.length) { skipped++; continue; }
    // bought something since leaving the cart? then no reminder
    const { data: bought } = await db.from("orders").select("id").eq("user_id", c.user_id).gt("created_at", c.updated_at).limit(1);
    const done = bought?.length ? true : await notifyAbandonedCart(c.user_id, c.cart_items.map((i) => i.product_id));
    await db.from("carts").update({ reminded_at: new Date().toISOString() }).eq("id", c.id);
    if (done && !bought?.length) sent++; else skipped++;
  }
  return Response.json({ ok: true, sent, skipped });
}
