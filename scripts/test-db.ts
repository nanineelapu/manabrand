/**
 * Applies every migration + seed to an in-process Postgres (PGlite) and verifies the
 * security guarantees (RLS, role protection, server-only account creation).
 * Supabase's `auth` schema is stubbed. Run:  npm run db:test
 */
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";

const db = new PGlite();
let passed = 0, failed = 0;
const ok = (name: string, cond: boolean, extra = "") => { if (cond) passed++; else failed++; console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${cond ? "" : extra}`); };
async function mustFail(name: string, fn: () => Promise<unknown>, match?: RegExp) {
  try { await fn(); ok(name, false, "(expected an error, got success)"); }
  catch (e) { const m = String((e as Error).message); ok(name, !match || match.test(m), `(wrong error: ${m})`); }
}
const as = async (role: "anon" | "authenticated" | "service_role" | "postgres", sub?: string) => {
  await db.exec(`reset role;`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(sub ? { sub, role } : { role })]);
  if (role !== "postgres") await db.exec(`set role ${role};`);
};
const one = async <T = Record<string, unknown>>(sql: string, p: unknown[] = []) => (await db.query<T>(sql, p)).rows;

async function main() {
  // ---- Supabase auth stub -------------------------------------------------
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid default auth.uid());
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)] $$;
    grant usage on schema storage to anon, authenticated, service_role;
    grant all on storage.objects to authenticated, service_role; grant select on storage.buckets to anon, authenticated, service_role;
  `);

  // ---- migrations + seed ----------------------------------------------------
  for (const f of readdirSync("supabase/migrations").sort()) await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  await db.exec(`grant usage on schema public to anon, authenticated, service_role;
                 grant all on all tables in schema public to authenticated, service_role;
                 grant select on all tables in schema public to anon;
                 grant usage on all sequences in schema public to authenticated, service_role;`);
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  const counts = await one<{ n: number }>(`select count(*)::int n from products`);
  ok("migrations + seed apply cleanly (46 products)", counts[0].n === 46);

  // ---- account creation ---------------------------------------------------------
  const server = JSON.stringify({ provisioned_by: "mana-server" });
  await db.query(`insert into auth.users (email, raw_user_meta_data) values ('x@y.com', '{"phone":"+919800000000","full_name":"Mallory"}')`);
  ok("a bare sign-up (no server flag) gets NO profile, so it can do nothing", (await one(`select 1 from profiles where email = 'x@y.com'`)).length === 0);
  // Supabase Auth can attach app_metadata AFTER inserting the user — the profile must appear on that update too
  const lateId = (await one<{ id: string }>(`insert into auth.users (email, raw_user_meta_data) values ('late@y.com', '{"phone":"+919876500123","full_name":"Late Mark"}') returning id`))[0].id;
  ok("no profile before the server mark arrives", (await one(`select 1 from profiles where id = $1`, [lateId])).length === 0);
  await db.query(`update auth.users set raw_app_meta_data = '{"provisioned_by":"mana-server","role":"customer"}'::jsonb where id = $1`, [lateId]);
  ok("profile is created when the server mark arrives after the insert", (await one(`select 1 from profiles where id = $1 and role = 'customer'`, [lateId])).length === 1);

  const mk = async (email: string, phone: string | null, name: string, app = server, user: object = {}) =>
    (await one<{ id: string }>(`insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ($1, $2::jsonb, $3::jsonb) returning id`,
      [email, app, JSON.stringify({ full_name: name, ...(phone ? { phone } : {}), ...user })]))[0].id;

  const anita = await mk("anita@example.com", "+919811111111", "Anita Rao");
  const bhavin = await mk("bhavin@example.com", "+919822222222", "Bhavin Shah");
  const p1 = (await one<{ role: string; phone: string }>(`select role, phone from profiles where id = $1`, [anita]))[0];
  ok("server-provisioned customer gets a profile with role=customer and phone", p1.role === "customer" && p1.phone === "+919811111111");

  await mustFail("duplicate phone is rejected", () => mk("other@example.com", "+919811111111", "Dup Phone"), /duplicate key|unique/);
  await mustFail("duplicate email is rejected (case-insensitive)", () => mk("ANITA@example.com", "+919833333333", "Dup Mail"), /duplicate key|unique/);
  await mustFail("invalid phone format is rejected", () => mk("bad@example.com", "98123", "Bad Phone"), /profiles_phone_format|violates check/);
  await mustFail("customer without phone is rejected", () => mk("nophone@example.com", null, "No Phone"), /customer_needs_phone|violates check/);

  const mal = await mk("mal@example.com", "+919844444444", "Mallory", server, { role: "admin" });
  ok("role in user_metadata is IGNORED (cannot self-promote)", (await one<{ role: string }>(`select role from profiles where id=$1`, [mal]))[0].role === "customer");

  const admin = await mk("boss@mana.in", null, "Boss Admin", JSON.stringify({ provisioned_by: "mana-server", role: "admin", admin_role: "Super admin" }));
  ok("admin created via app_metadata is in admin_members", (await one(`select 1 from admin_members where user_id=$1`, [admin])).length === 1);

  // ---- profile protection -----------------------------------------------------
  await as("authenticated", anita);
  ok("customer sees only their own profile", (await one(`select id from profiles`)).length === 1);
  await db.exec(`update profiles set full_name = 'Anita R' where id = '${anita}'`);
  ok("customer can edit their own name", (await one<{ full_name: string }>(`select full_name from profiles where id='${anita}'`))[0].full_name === "Anita R");
  await mustFail("customer cannot make themselves admin", () => db.exec(`update profiles set role='admin' where id='${anita}'`), /protected profile fields/);
  await mustFail("customer cannot change tier", () => db.exec(`update profiles set tier='VIP' where id='${anita}'`), /protected profile fields/);
  await mustFail("customer cannot change phone", () => db.exec(`update profiles set phone='+919899999999' where id='${anita}'`), /protected profile fields/);
  await as("authenticated", admin);
  ok("admin can read all profiles", (await one(`select id from profiles`)).length === 5);

  // ---- server-only tables -------------------------------------------------------
  await as("service_role");
  await db.query(`insert into login_attempts (identifier, success) values ('+919811111111', false)`);
  ok("service role can write/read login_attempts", (await one(`select 1 from login_attempts`)).length === 1);
  await as("authenticated", anita);
  ok("customer sees ZERO login_attempts rows (cannot learn lockout state)", (await one(`select 1 from login_attempts`)).length === 0);
  await mustFail("customer cannot insert login_attempts", () => db.query(`insert into login_attempts (identifier, success) values ('x', true)`), /row-level/);

  // ---- catalogue visibility ---------------------------------------------------
  await as("postgres");
  const activeN = (await one<{ n: number }>(`select count(*)::int n from products where status='active'`))[0].n;
  await as("anon");
  const vis = await one<{ n: number }>(`select count(*)::int n from products`);
  ok("anon sees only active products (draft/in-review hidden)", vis[0].n === activeN && activeN >= 40, `(saw ${vis[0].n}, active ${activeN})`);
  ok("anon cannot see pending sellers", (await one(`select 1 from sellers where status='pending'`)).length === 0);
  await mustFail("anon cannot insert a product", () => db.exec(`insert into products (slug, seller_id, category_id, name, price, mrp) select 'hack', id, (select id from categories limit 1), 'Hack', 1, 1 from sellers limit 1`), /row-level|permission/);

  // ---- orders cannot be forged; isolation between customers -------------------
  await as("postgres");
  const prod = (await one<{ id: string; seller_id: string }>(`select id, seller_id from products where status='active' limit 1`))[0];
  const addr = JSON.stringify({ name: "A", line1: "x", city: "Mumbai", pincode: "400050" });
  const ord = (await one<{ id: string }>(`insert into orders (user_id, subtotal, total, payment_method, address, status) values ($1, 1000, 1000, 'upi', $2::jsonb, 'delivered') returning id`, [anita, addr]))[0].id;
  await db.query(`insert into order_items (order_id, product_id, seller_id, name, option_value, qty, price) values ($1, $2, $3, 'Item', 'M', 1, 1000)`, [ord, prod.id, prod.seller_id]);
  await as("authenticated", anita);
  ok("customer reads their own order", (await one(`select 1 from orders`)).length === 1);
  await mustFail("customer cannot INSERT an order (price forging)", () => db.query(`insert into orders (user_id, subtotal, total, payment_method, address) values ($1, 1, 1, 'upi', '{}')`, [anita]), /row-level/);
  await as("authenticated", bhavin);
  ok("another customer cannot see that order", (await one(`select 1 from orders`)).length === 0);
  ok("another customer cannot see its items", (await one(`select 1 from order_items`)).length === 0);

  // ---- reviews: only verified buyers; counters update ---------------------------
  await as("authenticated", bhavin);
  await mustFail("non-buyer cannot review", () => db.query(`insert into reviews (product_id, user_id, rating, status, verified) values ($1, $2, 5, 'pending', true)`, [prod.id, bhavin]), /row-level/);
  await as("authenticated", anita);
  await db.query(`insert into reviews (product_id, user_id, rating, status, verified) values ($1, $2, 5, 'pending', true)`, [prod.id, anita]);
  await mustFail("buyer cannot self-publish a review", () => db.query(`insert into reviews (product_id, user_id, rating, status, verified) values ($1, $2, 5, 'published', true)`, [(prod.id), anita]), /row-level|duplicate/);
  await as("postgres");
  await db.exec(`update reviews set status='published'`);
  ok("rating trigger updates product counters", (await one<{ review_count: number; rating_avg: string }>(`select review_count, rating_avg from products where id='${prod.id}'`))[0].review_count === 1);
  await db.exec(`update orders set status='returned'; update orders set status='delivered'`);
  ok("sold_count trigger counts delivered items", (await one<{ sold_count: number }>(`select sold_count from products where id='${prod.id}'`))[0].sold_count >= 1);

  // ---- seller isolation -----------------------------------------------------------
  await as("postgres");
  const sellerUser = await mk("seller@shop.in", null, "Shop Owner", JSON.stringify({ provisioned_by: "mana-server", role: "seller" }));
  await as("service_role");
  await db.query(`update sellers set owner_id=$1 where id=$2`, [sellerUser, prod.seller_id]);
  await as("postgres");
  const other = (await one<{ id: string }>(`select id from sellers where id <> $1 and status='active' limit 1`, [prod.seller_id]))[0].id;
  await as("authenticated", sellerUser);
  ok("seller sees their own order lines via seller_orders", (await one(`select 1 from seller_orders`)).length === 1);
  await mustFail("seller cannot read orders table (totals/payment)", async () => { const r = await one(`select 1 from orders`); if (r.length) throw new Error("leak"); throw new Error("row-level: no rows"); }, /row-level/);
  await db.query(`insert into products (slug, seller_id, category_id, name, price, mrp, status) select 's-draft', $1, (select id from categories limit 1), 'Seller Draft', 100, 100, 'draft'`, [prod.seller_id]);
  ok("seller can create a DRAFT product for their own store", true);
  await mustFail("seller cannot publish a product directly", () => db.query(`insert into products (slug, seller_id, category_id, name, price, mrp, status) select 's-live', $1, (select id from categories limit 1), 'Seller Live', 100, 100, 'active'`, [prod.seller_id]), /row-level/);
  await mustFail("seller cannot add products to ANOTHER seller", () => db.query(`insert into products (slug, seller_id, category_id, name, price, mrp, status) select 's-x', $1, (select id from categories limit 1), 'Steal', 100, 100, 'draft'`, [other]), /row-level/);
  await mustFail("seller cannot change their own commission", () => db.query(`update sellers set commission_pct = 0 where id = $1`, [prod.seller_id]), /protected seller fields/);


  // =====================================================================================
  // BUSINESS LOGIC (RPCs)
  // =====================================================================================
  await as("postgres");
  await db.exec(`insert into coupons (code, description, type, value, min_order, max_discount, usage_limit) values
                   ('WELCOME10', '10% off first order', 'percent', 10, 999, 500, 100),
                   ('FLAT200', 'Flat 200', 'flat', 200, 1500, null, 100),
                   ('FREESHIP', 'Free shipping', 'shipping', 0, 100, null, 100)`);
  const shopper = await mk("shopper@example.com", "+919855555555", "Sam Shopper");
  const other2 = await mk("other2@example.com", "+919866666666", "Other Person");
  const buyer = await mk("buyer@example.com", "+919877777777", "Bea Buyer");
  const prods = await one<{ id: string; seller_id: string; price: number; v: string; stock: number }>(
    `select p.id, p.seller_id, p.price, po.value v, po.stock from products p join product_options po on po.product_id = p.id
      where p.status='active' and po.stock >= 8 and p.price < 1400 order by p.price limit 2`);
  const A = prods[0], B = prods[1];
  const ADDR = { name: "Sam", phone: "+919855555555", line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" };
  const stockOf = async (pid: string, v: string) => (await one<{ stock: number }>(`select stock from product_options where product_id=$1 and value=$2`, [pid, v]))[0].stock;
  const place = (items: object[], extra: { pay?: string; coupon?: string | null; express?: boolean; addr?: object } = {}) =>
    one<{ order_id: string; order_number: string; total: number }>(
      `select * from place_order($1::jsonb, $2::jsonb, $3::payment_method, $4, $5)`,
      [JSON.stringify(items), JSON.stringify(extra.addr ?? ADDR), extra.pay ?? "upi", extra.coupon ?? null, extra.express ?? false]);

  await as("anon");
  await mustFail("anon cannot place an order", () => place([{ product_id: A.id, option_value: A.v, qty: 1 }]), /permission denied|sign in/);

  await as("authenticated", shopper);
  const s0 = await stockOf(A.id, A.v);
  const o1 = (await place([{ product_id: A.id, color: "Black", option_value: A.v, qty: 1 }]))[0];
  ok("place_order returns an order number MB-xxxxx", /^MB-\d{5,}$/.test(o1.order_number));
  ok("total is computed on the SERVER (price*qty + ₹99 shipping under ₹1,499)", o1.total === A.price + 99, `(got ${o1.total}, expected ${A.price + 99})`);
  await as("postgres");
  ok("stock was decremented atomically", (await stockOf(A.id, A.v)) === s0 - 1);
  ok("first event 'placed' recorded", (await one(`select 1 from order_events where order_id=$1 and status='placed'`, [o1.order_id])).length === 1);
  ok("admin + seller notified of the new order", (await one(`select 1 from notifications where title like $1`, [`New order ${o1.order_number}%`])).length >= 1);

  await as("authenticated", shopper);
  await mustFail("quantity 0 rejected", () => place([{ product_id: A.id, option_value: A.v, qty: 0 }]), /Invalid quantity/);
  await mustFail("quantity 11 rejected", () => place([{ product_id: A.id, option_value: A.v, qty: 11 }]), /Invalid quantity/);
  await mustFail("unknown option rejected", () => place([{ product_id: A.id, option_value: "NOPE", qty: 1 }]), /Not enough stock/);
  await mustFail("incomplete address rejected", () => place([{ product_id: A.id, option_value: A.v, qty: 1 }], { addr: { name: "x" } }), /complete delivery address/);
  await mustFail("empty bag rejected", () => place([]), /empty/);
  const sBefore = await stockOf(A.id, A.v);
  await mustFail("oversell rolls back EVERYTHING (second line fails)", () => place([{ product_id: A.id, option_value: A.v, qty: 1 }, { product_id: B.id, option_value: B.v, qty: 10 }, { product_id: B.id, option_value: B.v, qty: 10 }]), /Not enough stock/);
  ok("failed order left stock untouched (transaction rolled back)", (await stockOf(A.id, A.v)) === sBefore);
  await as("postgres");
  const draft = (await one<{ id: string }>(`select id from products where status <> 'active' limit 1`))[0];
  await as("authenticated", shopper);
  await mustFail("inactive product cannot be ordered", () => place([{ product_id: draft.id, option_value: "M", qty: 1 }]), /no longer available/);

  // coupons (a fresh buyer, so "first order" rules can be tested)
  await as("authenticated", buyer);
  const big = await one<{ id: string; v: string; price: number }>(`select p.id, po.value v, p.price from products p join product_options po on po.product_id=p.id where p.status='active' and po.stock>=8 and p.price between 1200 and 2600 limit 1`);
  const o2 = (await place([{ product_id: big[0].id, option_value: big[0].v, qty: 1 }], { coupon: "welcome10" }))[0];
  const exp2 = big[0].price - Math.min(500, Math.round(big[0].price * 0.1)) + 99;
  ok("WELCOME10 applied server-side (case-insensitive) with correct total", o2.total === exp2, `(got ${o2.total}, expected ${exp2})`);
  await mustFail("WELCOME10 only works for the first order", () => place([{ product_id: big[0].id, option_value: big[0].v, qty: 1 }], { coupon: "WELCOME10" }), /first order/);
  await mustFail("unknown coupon rejected", () => place([{ product_id: A.id, option_value: A.v, qty: 1 }], { coupon: "HACK100" }), /not valid/);
  await mustFail("coupon below minimum order rejected", () => place([{ product_id: A.id, option_value: A.v, qty: 1 }], { coupon: "FLAT200" }), /Add ₹/);
  const o3 = (await place([{ product_id: B.id, option_value: B.v, qty: 1 }, { product_id: A.id, option_value: A.v, qty: 1 }], { coupon: "FREESHIP", pay: "cod", express: true }))[0];
  ok("shipping coupon + COD fee (+40) + express (+149) computed", o3.total === A.price + B.price + 40 + 149, `(got ${o3.total})`);

  // cancel / stock restore / isolation
  await as("authenticated", other2);
  await mustFail("another customer cannot cancel someone else's order", () => db.query(`select cancel_order($1)`, [o1.order_id]), /Order not found/);
  await as("authenticated", shopper);
  const sMid = await stockOf(A.id, A.v);
  await db.query(`select cancel_order($1, 'Changed my mind')`, [o1.order_id]);
  ok("cancel_order restores stock", (await stockOf(A.id, A.v)) === sMid + 1);

  // ---- wallet: ₹500 welcome credit, spending it at checkout, never overspending, refund on cancel
  await as("postgres");
  const custN = (await one<{ n: number }>(`select count(*)::int n from profiles where role = 'customer'`))[0].n;
  const welcomeN = (await one<{ n: number }>(`select count(*)::int n from wallet_transactions where kind = 'welcome' and amount = 500`))[0].n;
  ok("every new customer got the ₹500 welcome credit", custN > 0 && welcomeN === custN);
  ok("staff accounts get no welcome credit", (await one(`select 1 from wallet_transactions w join profiles p on p.id = w.user_id where p.role <> 'customer'`)).length === 0);
  const bal = async () => (await one<{ b: number }>(`select coalesce(sum(amount), 0)::int b from wallet_transactions where user_id = $1`, [shopper]))[0].b;
  const before = await bal();
  await as("authenticated", shopper);

  // Items worth under ₹999 (599) -> wallet use is 0
  const under = (await one<{ order_id: string; order_number: string; total: number }>(`select * from place_order_wallet($1::jsonb, $2::jsonb, 'cod'::payment_method, null, false, 200)`, [JSON.stringify([{ product_id: A.id, option_value: A.v, qty: 1 }]), JSON.stringify(ADDR)]))[0];
  ok("wallet cannot be used on orders under ₹999", under.total === A.price + 99 + 40 && (await one<{ w: number }>(`select wallet_used w from orders where id = $1`, [under.order_id]))[0].w === 0);

  // Items worth 1198 (the ₹999 tier) -> capped at 200
  const orderTotal999 = A.price * 2 + 99 + 40;
  const wl = (await one<{ order_id: string; order_number: string; total: number }>(`select * from place_order_wallet($1::jsonb, $2::jsonb, 'cod'::payment_method, null, false, 300)`, [JSON.stringify([{ product_id: A.id, option_value: A.v, qty: 2 }]), JSON.stringify(ADDR)]))[0];
  ok("wallet lowers the order total by the tier cap (max 200 from ₹999 of items)", wl.total === orderTotal999 - 200, `(got ${wl.total}, expected ${orderTotal999 - 200})`);
  await as("postgres");
  ok("the spend is recorded in the ledger and on the order", (await bal()) === before - 200 && (await one<{ w: number }>(`select wallet_used w from orders where id = $1`, [wl.order_id]))[0].w === 200);
  await as("authenticated", shopper);

  // In >= 2499 tier: 5 items of A (5 * 599 = 2995, free shipping) -> tier cap is 350, capped at remaining bal 300
  const over = (await one<{ order_id: string; total: number }>(`select * from place_order_wallet($1::jsonb, $2::jsonb, 'cod'::payment_method, null, false, 99999)`, [JSON.stringify([{ product_id: A.id, option_value: A.v, qty: 5 }]), JSON.stringify(ADDR)]))[0];
  await as("postgres");
  ok("the wallet can never go below zero (spend is capped at the balance)", (await bal()) === 0);
  const afterOver = await bal();
  await as("service_role");   // only the server (or an admin) may refund
  await db.query(`select wallet_refund_order($1)`, [wl.order_id]); await db.query(`select wallet_refund_order($1)`, [wl.order_id]);
  await as("postgres");
  ok("cancelling gives the wallet money back — once, even if asked twice", (await bal()) === afterOver + 200);
  await as("authenticated", other2);
  ok("a customer cannot see someone else's wallet", (await one(`select 1 from wallet_transactions where user_id = $1`, [shopper])).length === 0);
  void over;
  await as("authenticated", shopper);
  ok("order is cancelled with an event", (await one(`select 1 from orders o join order_events e on e.order_id=o.id where o.id=$1 and o.status='cancelled' and e.status='cancelled'`, [o1.order_id])).length === 1);
  await mustFail("cancelled order cannot be cancelled again", () => db.query(`select cancel_order($1)`, [o1.order_id]), /no longer be cancelled/);

  // status flow: customer can't, wrong seller can't, owner seller steps, admin finishes
  await as("postgres");
  const selOwner = await mk("flow-seller@shop.in", null, "Flow Seller", JSON.stringify({ provisioned_by: "mana-server", role: "seller" }));
  const otherOwner = await mk("flow-seller2@shop.in", null, "Other Seller", JSON.stringify({ provisioned_by: "mana-server", role: "seller" }));
  const sellerB = (await one<{ seller_id: string }>(`select seller_id from order_items where order_id=$1 limit 1`, [o2.order_id]))[0].seller_id;
  const sellerOther = (await one<{ id: string }>(`select id from sellers where id <> $1 and status='active' limit 1`, [sellerB]))[0].id;
  await as("service_role");
  await db.query(`update sellers set owner_id=$1 where id=$2`, [selOwner, sellerB]);
  await db.query(`update sellers set owner_id=$1 where id=$2`, [otherOwner, sellerOther]);
  const setSt = (id: string, st: string) => db.query(`select set_order_status($1, $2::order_status, 'ok')`, [id, st]);
  await as("authenticated", shopper);
  await mustFail("customer cannot change order status", () => setSt(o2.order_id, "confirmed"), /Not allowed/);
  await as("authenticated", otherOwner);
  await mustFail("a seller with no items in the order cannot change it", () => setSt(o2.order_id, "confirmed"), /Not allowed/);
  await as("authenticated", selOwner);
  await setSt(o2.order_id, "confirmed");
  ok("seller can confirm their order", (await one<{ status: string }>(`select status from seller_orders where order_id=$1 limit 1`, [o2.order_id]))[0].status === "confirmed");
  await mustFail("seller cannot skip steps", () => setSt(o2.order_id, "shipped"), /one step at a time/);
  await mustFail("seller cannot mark delivered", () => setSt(o2.order_id, "delivered"), /one step at a time/);
  await setSt(o2.order_id, "packed"); await setSt(o2.order_id, "shipped");
  const shipped = (await one<{ awb: string; courier: string }>(`select awb, courier from seller_orders where order_id=$1 limit 1`, [o2.order_id]))[0];
  ok("shipping sets the delivery to ManaBrand Delivery and invents no tracking number", shipped.courier === "ManaBrand Delivery" && !shipped.awb);
  await mustFail("cannot move an order backwards", () => setSt(o2.order_id, "packed"), /backwards/);
  await as("authenticated", admin);
  await setSt(o2.order_id, "out_for_delivery"); await setSt(o2.order_id, "delivered");
  ok("admin can complete delivery; timeline has every step", (await one(`select 1 from order_events where order_id=$1`, [o2.order_id])).length >= 6);

  // returns
  await as("authenticated", other2);
  const item2 = (await one<{ id: string }>(`select id from order_items where order_id=$1 limit 1`, [o2.order_id]));
  await as("postgres");
  const itemId = (await one<{ id: string }>(`select id from order_items where order_id=$1 limit 1`, [o2.order_id]))[0].id;
  void item2;
  await as("authenticated", other2);
  await mustFail("a different customer cannot return it", () => db.query(`select request_return($1,$2,'exchange','Wrong size')`, [o2.order_id, itemId]), /Order not found/);
  await as("authenticated", buyer);
  await mustFail("a refund or plain return is refused — exchanges only", () => db.query(`select request_return($1,$2,'refund','Wrong size')`, [o2.order_id, itemId]), /exchanges only/);
  await mustFail("return needs a reason", () => db.query(`select request_return($1,$2,'exchange','  ')`, [o2.order_id, itemId]), /reason/);
  const ret = (await one<{ request_return: string }>(`select request_return($1,$2,'exchange','Wrong size')`, [o2.order_id, itemId]))[0].request_return;
  ok("delivered order: exchange request created", !!ret);
  await mustFail("duplicate return for the same item blocked", () => db.query(`select request_return($1,$2,'exchange','Again')`, [o2.order_id, itemId]), /already open/);
  await as("authenticated", otherOwner);
  await mustFail("unrelated seller cannot decide a return", () => db.query(`select decide_return($1,'approved')`, [ret]), /Not allowed/);
  await as("authenticated", selOwner);
  await db.query(`select decide_return($1,'approved')`, [ret]);
  await db.query(`select decide_return($1,'picked_up')`, [ret]);
  await mustFail("only admin can complete the exchange", () => db.query(`select decide_return($1,'refunded')`, [ret]), /not allowed from/);
  await as("authenticated", admin);
  await db.query(`select decide_return($1,'refunded')`, [ret]);
  const after = (await one<{ payment_status: string; status: string }>(`select payment_status, status from orders where id=$1`, [o2.order_id]))[0];
  ok("completing an exchange never refunds the payment and the order stays delivered", after.payment_status !== "refunded" && after.status === "delivered");

  // old delivery → return window closed
  await as("postgres");
  const o4 = (await one<{ id: string }>(`insert into orders (user_id, subtotal, total, payment_method, address, status) values ($1, 500, 500, 'upi', '{}', 'delivered') returning id`, [shopper]))[0].id;
  const it4 = (await one<{ id: string }>(`insert into order_items (order_id, product_id, seller_id, name, option_value, qty, price) values ($1,$2,$3,'Old',$4,1,500) returning id`, [o4, A.id, A.seller_id, A.v]))[0].id;
  await db.query(`insert into order_events (order_id, status, created_at) values ($1,'delivered', now() - interval '10 days')`, [o4]);
  await as("authenticated", shopper);
  await mustFail("return after 7 days is refused", () => db.query(`select request_return($1,$2,'exchange','Late')`, [o4, it4]), /7-day/);

  // payouts + dashboards
  await as("authenticated", shopper);
  await mustFail("customer cannot generate payouts", () => db.query(`select generate_payouts(current_date - 30, current_date)`), /Not allowed/);
  await mustFail("customer cannot read the admin dashboard", () => db.query(`select admin_dashboard()`), /Not allowed/);
  await as("authenticated", admin);
  const n1 = (await one<{ generate_payouts: number }>(`select generate_payouts(current_date - 30, current_date)`))[0].generate_payouts;
  const n2 = (await one<{ generate_payouts: number }>(`select generate_payouts(current_date - 30, current_date)`))[0].generate_payouts;
  ok("payout run is idempotent (second run creates nothing)", n2 === 0 && n1 >= 0);
  const dash = (await one<{ admin_dashboard: Record<string, unknown> }>(`select admin_dashboard()`))[0].admin_dashboard;
  ok("admin dashboard returns revenue, 30-day series and status counts", typeof dash.revenue30 === "number" && Array.isArray(dash.daily) && (dash.daily as unknown[]).length === 30 && Array.isArray(dash.statusCounts));
  await as("authenticated", selOwner);
  const sd = (await one<{ seller_dashboard: Record<string, unknown> }>(`select seller_dashboard($1)`, [sellerB]))[0].seller_dashboard;
  ok("seller dashboard works for the owner", typeof sd.monthSales === "number");
  await mustFail("seller dashboard of ANOTHER seller is refused", () => db.query(`select seller_dashboard($1)`, [sellerOther]), /Not allowed/);

  // storage
  await as("postgres");
  ok("5 storage buckets created, KYC bucket is private", (await one(`select 1 from storage.buckets`)).length === 5 && (await one(`select public from storage.buckets where id='seller-kyc'`))[0].public === false);
  await as("authenticated", selOwner);
  await db.query(`insert into storage.objects (bucket_id, name) values ('product-images', $1)`, [`${sellerB}/p1/a.jpg`]);
  ok("seller can upload product images into THEIR folder", true);
  await mustFail("seller cannot upload into another seller's folder", () => db.query(`insert into storage.objects (bucket_id, name) values ('product-images', $1)`, [`${sellerOther}/p1/a.jpg`]), /row-level/);
  await db.query(`insert into storage.objects (bucket_id, name) values ('seller-kyc', $1)`, [`${sellerB}/pan.pdf`]);
  await as("authenticated", otherOwner);
  ok("another seller cannot read someone's KYC document", (await one(`select 1 from storage.objects where bucket_id='seller-kyc'`)).length === 0);
  await as("authenticated", admin);
  ok("admin can read KYC documents", (await one(`select 1 from storage.objects where bucket_id='seller-kyc'`)).length === 1);
  await as("authenticated", shopper);
  await mustFail("customer cannot upload to banners", () => db.query(`insert into storage.objects (bucket_id, name) values ('banners','x.jpg')`), /row-level/);

  // ---- seller permissions: the admin decides what each seller may do ------------------
  const insProd = (slug: string, status: string) => db.query(`insert into products (slug, seller_id, category_id, name, price, mrp, status) select $1, $2, (select id from categories limit 1), 'Perm test', 100, 100, $3`, [slug, prod.seller_id, status]);
  // (an earlier flow test moved this store to a different owner account, so look the current owner up)
  await as("postgres");
  const permOwner = (await one<{ owner_id: string }>(`select owner_id from sellers where id = $1`, [prod.seller_id]))[0].owner_id;
  await as("authenticated", permOwner);
  await insProd("perm-review", "pending_review");
  ok("default seller can submit a product for review", true);
  await mustFail("default seller cannot publish directly", () => insProd("perm-live-1", "active"), /row-level/);
  await mustFail("a seller cannot grant themselves permissions", () => db.query(`update sellers set permissions = '{"add_products":true,"publish_directly":true}'::jsonb where id = $1`, [prod.seller_id]), /protected seller fields/);
  await as("authenticated", admin);
  await db.query(`update sellers set permissions = permissions || '{"publish_directly":true}'::jsonb where id = $1`, [prod.seller_id]);
  await as("authenticated", permOwner);
  await insProd("perm-live-2", "active");
  ok("admin can allow a seller to publish directly", true);
  await as("authenticated", admin);
  await db.query(`update sellers set permissions = permissions || '{"add_products":false}'::jsonb where id = $1`, [prod.seller_id]);
  await as("authenticated", permOwner);
  await mustFail("admin can switch product access off for a seller", () => insProd("perm-off", "draft"), /row-level/);
  await mustFail("…and they cannot edit existing products either", async () => { const r = await db.query(`update products set price = 1 where slug = 'perm-review' returning id`); if (!r.rows.length) throw new Error("row-level: nothing updated"); }, /row-level/);
  await as("postgres");
  ok("seller_can is false for a seller who is not approved", (await one<{ c: boolean }>(`select seller_can((select id from sellers where status='pending' limit 1), 'add_products') c`))[0].c === false);
  await as("authenticated", admin);
  await db.query(`update sellers set permissions = '{"add_products":true,"publish_directly":false,"manage_inventory":true,"run_promotions":true,"view_earnings":true}'::jsonb where id = $1`, [prod.seller_id]);

  // ---- collections: only an admin can create / change / delete them; everyone can read them
  await as("authenticated", shopper);
  await mustFail("customer cannot create a collection", () => db.query(`insert into collections (slug, name) values ('hack', 'Hack')`), /row-level/);
  await as("authenticated", admin);
  const col = await one<{ id: string }>(`insert into collections (slug, name, story, photo_kind, sort) values ('festival-gifts', 'Festival gifts', 'test', 'candle', 99) returning id`);
  const colProds = await one<{ id: string }>(`select id from products where status='active' limit 2`);
  for (const [i, pr] of colProds.entries()) await db.query(`insert into collection_products (collection_id, product_id, sort) values ($1,$2,$3)`, [col[0].id, pr.id, i]);
  ok("admin can create a collection and add products", (await one(`select 1 from collection_products where collection_id=$1`, [col[0].id])).length === 2);
  await as("anon");
  ok("anyone can read collections and their products", (await one(`select 1 from collections where slug='festival-gifts'`)).length === 1 && (await one(`select 1 from collection_products where collection_id=$1`, [col[0].id])).length === 2);
  await as("authenticated", shopper);
  const del = await one(`delete from collections where slug='festival-gifts' returning id`);
  ok("customer cannot delete a collection", del.length === 0);
  await as("authenticated", admin);
  await db.query(`delete from collections where slug='festival-gifts'`);
  ok("deleting a collection removes its product links", (await one(`select 1 from collection_products where collection_id=$1`, [col[0].id])).length === 0);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
