# ManaBrand — what to do next (outside the code)

Everything below happens in dashboards (Supabase, Vercel, Resend, Razorpay, Sanity), not in the code.
Work top to bottom. Tick each box.

---

## 1. Supabase — database (SQL Editor)

Open **Supabase → SQL Editor → New query**. For each file: open it in VS Code, copy everything, paste, **Run**.

- [ ] `supabase/migrations/20261115000001_identity.sql`
- [ ] `…000002_catalog.sql`
- [ ] `…000003_commerce.sql`
- [ ] `…000004_operations.sql`
- [ ] `…000005_functions.sql`
- [ ] `…000006_storage.sql`
- [ ] `…000007_app_support.sql`
- [ ] `…000008_seller_permissions.sql`
- [ ] `…000009_admin_tools.sql`  (product SEO fields + Deal Box settings)
- [ ] `…000010_payments_alerts_reviews.sql`  (back-in-stock alerts, cart reminders, review photos)
- [ ] `…000011_own_delivery.sql`  (no more made-up tracking numbers — delivery is "ManaBrand Delivery", tracking typed by hand)

If a file says something "already exists", that's fine — go on to the next.
If you already ran 0001–0008 earlier, you only need 0009, 0010 and 0011.

Then load the fashion catalogue:

- [ ] `supabase/fashion-v2.sql`
  **Warning:** deletes ALL products, categories, collections and ORDERS and the sample sellers, then loads the new Men / Women catalogue (46 products). Only run it while everything is demo data.
- [ ] `supabase/local-settings.sql`  (delivery fee rule + support phone)

## 2. Create the first admin (on your computer)

In the project folder:

```
npm run admin:create -- you@yourmail.com "A-Strong-Password-123" "Your Name"
```

- [ ] Password: at least 10 characters, letters + numbers.
- [ ] Sign in at `https://manabrand.vercel.app/admin/login`.
- [ ] If it says "Database error creating new user" → step 1 isn't finished (run every migration, in order).
- [ ] After logging in, change this password (Supabase → Authentication → Users).

## 3. Supabase — authentication settings

**Authentication → URL Configuration**
- [ ] Site URL: `https://manabrand.vercel.app`
- [ ] Redirect URLs: add `https://manabrand.vercel.app/**` and `http://localhost:3000/**`

**Authentication → Emails → SMTP Settings** (so PIN-reset emails are delivered)
- [ ] Enable Custom SMTP: host `smtp.resend.com`, port `465`, user `resend`, password = your Resend API key, sender = your `EMAIL_FROM` address.
- [ ] Authentication → Emails → Templates → *Reset password*: reword to say "reset your PIN", keep the `{{ .ConfirmationURL }}` link.

## 4. Resend — email

- [ ] You need a domain you own (e.g. `manabrand.in`). `vercel.app` addresses can't be verified.
- [ ] Resend → Domains → Add domain → add the DNS records it shows (SPF, DKIM, MX) at your domain registrar → **Verify**. Also add a DMARC record.
- [ ] Until the domain is verified: `EMAIL_FROM=ManaBrand <onboarding@resend.dev>` only delivers to the email you registered Resend with.
- [ ] **Create a NEW API key and delete the old one** — the old key was pasted in a chat.
- [ ] Make `care@manabrand.in` (or your chosen `SUPPORT_EMAIL`) a real inbox someone reads.
- [ ] Test: `npm run email:test -- your@email.com` (sends all 12 emails to you).

Details: `docs/EMAIL_SETUP.md`.

## 5. Vercel — environment variables

Vercel → your project → **Settings → Environment Variables** (add for Production, Preview, Development), then **Deployments → Redeploy**.
Variables starting with `NEXT_PUBLIC_` only take effect after a redeploy.

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://manabrand.vercel.app` (your real domain later) |
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page (anon / public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | same page (**secret** — never share) |
| `PIN_PEPPER` | the same long random string as in `.env.local` (never change it after customers register!) |
| `RESEND_API_KEY` | the new key from step 4 |
| `EMAIL_FROM` | `ManaBrand <care@yourdomain>` (or the `onboarding@resend.dev` form for testing) |
| `SUPPORT_EMAIL` | the inbox that receives contact-form messages |
| `CRON_SECRET` | any long random string (protects the daily cart-reminder job) |
| `BUSINESS_NAME`, `BUSINESS_GSTIN` | shown on invoices (optional until the client has a GSTIN) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | from sanity.io/manage |
| `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET` | from Sanity (see step 7) |

- [ ] Add them all, **Redeploy**.

## 6. Razorpay — online payments (the client does this)

Full steps and test cards: `docs/PAYMENTS_SETUP.md`.

- [ ] Client creates a Razorpay account and completes KYC (start in **Test Mode**).
- [ ] Settings → API Keys → generate. Copy Key Id + Key Secret.
- [ ] Settings → Webhooks → add `https://manabrand.vercel.app/api/razorpay/webhook`, a secret you invent, events `payment.captured`, `order.paid`, `refund.processed`.
- [ ] Vercel env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PAYMENT_MODE=live` → Redeploy.
- [ ] Test with Razorpay's test card `4111 1111 1111 1111`, then refund it from Admin → Orders.
- [ ] When happy: switch Razorpay to Live Mode, put the live keys in Vercel, redeploy.

Until this is done the site only offers Cash on delivery.

## 7. Sanity — website content (optional)

- [ ] If your Sanity project has OLD saved text (home page, navigation, site settings), either edit it in `/studio`, or wipe it so the new Ichapuram content shows:
  create a token at sanity.io/manage → API → Tokens (Editor), put it in `.env.local` as `SANITY_API_WRITE_TOKEN`, run `npm run sanity:reset` (preview) then `npm run sanity:reset -- --yes`.
- [ ] Add the webhook so edits go live instantly: sanity.io/manage → API → Webhooks → `https://manabrand.vercel.app/api/revalidate`, secret = `SANITY_REVALIDATE_SECRET`.

## 8. Real content (replace the demo data)

- [ ] Real sellers (they register at `/seller/register`; you approve them in Admin → Sellers).
- [ ] Real products + real photos (Admin → Products). The demo photos are stock images.
- [ ] Delivery is your own: on each order (Admin → Orders → open it) fill **Delivery details** (who delivers + optional tracking no.) BEFORE tapping "Mark as shipped".
- [ ] Invoices say plain "Invoice" until you add `BUSINESS_GSTIN` in Vercel, then they say "Tax invoice".
- [ ] Footwear is "coming soon" — add a Footwear category product when ready.
- [ ] Deal Box: Admin → Deal Box → set hours, price, picked products.
- [ ] Admin → Settings: delivery fees, payment methods, business details.
- [ ] Returns wording on the Shipping & returns page and FAQ is a default (7-day returns) — confirm with the client.
- [ ] Shekar Studio's phone / email / GSTIN in the sample data are placeholders.

## 9. Test the whole flow once (before telling anyone)

- [ ] Register a customer (phone + 4-digit PIN) → welcome email arrives.
- [ ] Add a product to the bag → the black "items in your bag" pill appears above the tab bar (phone).
- [ ] Place a Cash-on-delivery order → confirmation email + order shows in Admin.
- [ ] Admin: confirm → pack → ship → deliver → customer gets emails; print Invoice and Packing slip.
- [ ] Customer: request a return, write a review with a photo → approve it in Admin → Reviews.
- [ ] Sold-out size: "notify me" → add stock in Admin → Inventory → email arrives.
- [ ] Contact form → message reaches the support inbox.
- [ ] (After Razorpay) pay with the test card, refund it.

## 10. Safety

- [ ] Never share or commit `.env.local`. It is git-ignored.
- [ ] Anything pasted in a chat (Resend key, admin password) should be replaced with a new one.
- [ ] In Supabase, turn on backups (Project Settings → Database) before real orders arrive.
