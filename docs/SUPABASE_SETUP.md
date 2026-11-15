# Supabase setup — database, login & full backend

Everything is already written. You only need to connect a Supabase project.

## 1. Create the project and apply the database
1. Create a project at supabase.com.
2. **SQL Editor** → run these files **in order** (paste each, press Run):
   1. `supabase/migrations/20261115000001_identity.sql`
   2. `supabase/migrations/20261115000002_catalog.sql`
   3. `supabase/migrations/20261115000003_commerce.sql`
   4. `supabase/migrations/20261115000004_operations.sql`
   5. `supabase/migrations/20261115000005_functions.sql`  (order / stock / coupon / payout logic as Postgres functions)
   6. `supabase/migrations/20261115000006_storage.sql`  (buckets `product-images`, `seller-assets`, `banners` public; `seller-kyc` private)
   7. `supabase/migrations/20261115000007_app_support.sql`  (follows, review author names, order-item colours, seller views)
   8. `supabase/migrations/20261115000008_seller_permissions.sql`  (per-seller access that the admin controls)
   9. `supabase/seed.sql`  (68 products, 6 categories, 11 sellers, 4 collections)
   *(Or with the CLI: `supabase link` then `supabase db push`.)*

## 2. Environment
Copy `.env.example` → `.env.local` and fill it in:
| Variable | Where from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API (**secret**, server only) |
| `PIN_PEPPER` | run `openssl rand -hex 32` — keep it secret and **never change it** (every PIN would stop working) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (your real domain in production) |
| `RESEND_API_KEY` / `EMAIL_FROM` | optional; without it, welcome emails are only logged |
| `PAYMENT_MODE` | leave unset for **test mode** (UPI/card orders are marked paid immediately). Set `live` once a payment gateway webhook calls `confirm_payment` — until then online orders stay *awaiting payment* |

## 3. Supabase dashboard settings
- **Authentication → URL Configuration:** Site URL = your site URL; add Redirect URL `http://localhost:3000/auth/callback` (and the production one). Needed for the PIN-reset email link.
- **Authentication → Providers → Email:** keep enabled. "Confirm email" can stay on or off (accounts are created pre-confirmed by the server).
- **Authentication → Sign In / Providers:** turn **off "Allow new users to sign up"**. (The database already rejects direct sign-ups, this is a second lock.)
- **Authentication → Emails → Reset Password template:** reword it to say "set a new PIN".
- **Authentication → SMTP:** add your own SMTP (Resend, SES…). The built-in mailer is heavily rate-limited — fine for testing, not for production.

## 4. Create the first admin
```bash
npm run admin:create -- boss@manabrand.in "A-Strong-Password-123" "Your Name" admin "Super admin"
```
Then sign in at `/admin/login`. Sellers don't need the command any more: they register at `/seller/register` (email + password), land in a **pending** store, and you approve them under *Admin → Sellers*. Until approved they can edit their profile and upload KYC documents but not list products.

## 5. Restart `npm run dev` and try it
- `/register` → name, mobile, **email**, 6-digit PIN → you're signed in; a welcome email goes to the address given.
- `/login` → mobile + PIN. 5 wrong PINs in 15 min locks that number for the rest of the window.
- `/forgot-password` → enter email → link → `/reset-pin`.

## Who can do what (the three roles)
- **Customer** — browses, orders (cash on delivery until a payment gateway is connected), tracks their own orders. Must register / sign in to order.
- **Seller** — registers, then waits for approval. Once approved they run their own shop. **What each seller may do is set by the admin** in Admin → Sellers → *Seller access*: add & edit products, publish without review, manage stock, run promotions, see earnings. A normal seller can add products (which an admin reviews before they go live), update stock, run promotions and see earnings; the admin can switch any of these off, or allow a trusted seller to publish directly. Rules are enforced in the database, not just the screens.
- **Admin** — full access to everything.

## How the PIN is protected
1. **Never stored.** The PIN is turned into `HMAC-SHA256(PIN_PEPPER, "<phone>:<pin>")` and only that goes to Supabase Auth, which bcrypt-hashes it. A stolen database cannot be brute-forced (1,000,000 possible PINs would otherwise take seconds) without the server-only pepper.
2. **Throttled.** 5 failures / 15 min per phone (`login_attempts`, service-role only); sign-up limited to 5 / hour / IP; reset emails 3 / hour / address.
3. **Weak PINs refused** (111111, 123456, 121212, part of the phone number…), enforced on the server.
4. **Same error** for "no such number" and "wrong PIN" (no account enumeration).
5. **Accounts can only be created by our server** (database trigger rejects Supabase's public `signUp`), and the role comes from `app_metadata`, which a user can't edit.
6. No OTP / SMS cost; **email** is the single channel for communication and PIN recovery.

## Verify it yourself (no Supabase needed)
```bash
npm run db:test      # applies all migrations + seed to a local Postgres and runs 86 checks (RLS, stock, coupons, payouts, storage)
npm run auth:test    # 32 checks: phone/PIN rules, redirect safety, pepper derivation
```
Without Supabase keys the website still runs in **demo mode** (mock data, login explains what's missing).

## What is live once Supabase is connected
Every screen reads and writes the real database (`src/lib/data/supabase.ts` for reads, `src/lib/actions/*.ts` for writes). Prices, stock, coupons, shipping and status changes are decided **inside Postgres functions**, never in the browser.
- **Shoppers:** browse, cart & wishlist (synced to the account), checkout/place order, cancel, return, reviews, addresses, profile, follow stores, newsletter, contact form.
- **Admin:** orders (status + notes), returns, products (create/edit/photos/archive), categories, coupons, banners, review moderation, customers (block), sellers (approve/suspend/commission), payouts, settings, notifications.
- **Sellers:** register, store profile + logo/banner/KYC uploads, products with photos, inventory, orders, returns, promotions, support tickets, earnings.
- Photos upload straight from the browser to Supabase Storage; each seller can only write inside their own folder.

**Still sample data:** the analytics visitors / funnel / traffic-source / top-cities panels (revenue and orders per day are real). **Not built:** a payment gateway (see `PAYMENT_MODE`), team-member invites in Admin → Settings → Team, enforcing email verification.

Without Supabase keys the site runs in **demo mode** (mock data; every action succeeds locally and shows "(demo)"). See `docs/BACKEND_HANDOFF.md` for the full table list.

## Where things live (Supabase vs Sanity)
Shop data (products, orders, users, stock, coupons, banners, categories) → **Supabase**, managed in `/admin`.
Website words, menus and pages → **Sanity**, managed in `/studio` — see `docs/SANITY_SETUP.md`.
