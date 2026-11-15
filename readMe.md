# ManaBrand

A mobile-first online marketplace for local shops and trusted sellers (₹ INR, English). Shoppers browse and order from the **storefront**, sellers run their shop from the **seller hub**, and staff run everything from the **admin console**. All three share one brand.

- **Storefront** — `/` · home, shop, categories, product pages, cart, checkout, orders, account
- **Seller hub** — `/seller` · products, stock, orders, promotions, payouts, store profile
- **Admin console** — `/admin` · orders, products, sellers, customers, coupons, banners, payouts, settings
- **Content editor** — `/studio` · menus, home-page text, titles and pages (Sanity)

## Tech stack

| Area | Tool |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS 4 |
| Database, auth, storage | Supabase (Postgres, Row Level Security, Storage) |
| Site content (CMS) | Sanity — menus, announcement bar, footer, home hero, titles/SEO, info pages |
| State | Zustand (cart, wishlist) |
| Smooth scroll | Lenis |
| Tests | PGlite (local Postgres) for the database, plus scripts for auth and CMS |

Shop data (products, orders, users, stock, coupons, banners, categories) lives in **Supabase** and is managed in `/admin`. Website words, menus and pages live in **Sanity** and are managed in `/studio`.

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/nanineelapu/manabrand.git
cd manabrand
npm install
cp .env.example .env.local      # then fill in your values (see below)
npm run dev
```

Open http://localhost:3000.

**Demo mode:** with no Supabase keys in `.env.local`, the site still runs using built-in sample data (68 products, 6 categories, 11 sellers). Every action succeeds locally and shows "(demo)". Without a Sanity project id it uses its built-in text.

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. Never commit `.env.local` (it is git-ignored).

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. **Secret, server only** — bypasses security rules |
| `PIN_PEPPER` | Secret mixed into every customer PIN. Generate with `openssl rand -hex 32`. **Never change it** once customers have registered |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally, your real domain in production |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional — welcome emails (logged to the console when empty) |
| `PAYMENT_MODE` | Leave unset for test mode (online orders count as paid). `live` needs a payment gateway webhook |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | Optional — turns on the content editor |
| `SANITY_API_READ_TOKEN` | Only if your Sanity dataset is private |
| `SANITY_REVALIDATE_SECRET` | Shared secret for the Sanity webhook (`/api/revalidate`) |

## Connecting the backend

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor run the files in `supabase/migrations/` **in order** (`…0001` to `…0008`), then `supabase/seed.sql`.
3. Fill in `.env.local`, then restart `npm run dev`.
4. Create your admin account:
   ```bash
   npm run admin:create -- you@example.com "A-Strong-Password" "Your Name" admin "Super admin"
   ```
   Then sign in at `/admin/login`. Sellers register themselves at `/seller/register` and an admin approves them.
5. Optional: connect Sanity for editable site content.

Full step-by-step guides:
- [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) — database, login and Supabase settings
- [`docs/SANITY_SETUP.md`](docs/SANITY_SETUP.md) — content editor and webhook
- [`docs/BACKEND_HANDOFF.md`](docs/BACKEND_HANDOFF.md) — tables and how the backend is organised
- [`docs/CHECKLIST.md`](docs/CHECKLIST.md) — project status

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | Run ESLint |
| `npm run db:test` | Apply all migrations and the seed to a local Postgres and run the database checks (RLS, stock, coupons, payouts, storage) |
| `npm run auth:test` | Check phone and PIN rules and the PIN derivation |
| `npm run cms:test` | Check the Sanity queries against a sample dataset (no account needed) |
| `npm run admin:create` | Create an admin or seller login |
| `npm run db:seed:generate` | Regenerate `supabase/seed.sql` from the sample catalogue |

## How login works

- **Customers** sign in with a mobile number and a 6-digit PIN. No OTP or SMS. An email is required at sign-up for order updates and PIN reset.
- The real PIN is never stored: it is combined with `PIN_PEPPER` and hashed before it reaches Supabase.
- **Sellers and admins** sign in with email and password.
- Accounts can only be created by the server. The database rejects any direct sign-up.

## Project structure

```
src/
  app/            Routes: (store) storefront, admin, seller, (auth), studio, api
  components/     store/ · admin/ · seller/ · shared/ · ui/ · brand/
  lib/
    actions/      Server actions — every create / update / delete
    auth/         Phone + PIN login, sessions
    cms/          Sanity content layer with built-in fallbacks
    data/         Data layer: mock.ts and supabase.ts behind one index
    supabase/     Server, browser and admin clients
  sanity/         Content schemas and studio setup
supabase/
  migrations/     Database schema, security rules, functions, storage
  seed.sql        Sample data
scripts/          Database, auth and CMS tests; admin creation
docs/             Setup guides
```

## Installable app and staying signed in

- **Install as an app:** the storefront is a PWA. On Chrome / Edge / Android a small "Get the ManaBrand app" card (and an "Install the app" button in the footer) lets visitors add it to their home screen. On iPhone / iPad it shows the Safari steps (Share → Add to Home Screen). It then opens full-screen like an app. The service worker (`public/sw.js`) only registers in production builds and never caches logins, accounts, checkout, admin or seller pages. Offline visits show a friendly `/offline` page.
- **Stay signed in:** the login cookie lasts one year and is renewed silently on every visit (`src/lib/supabase/cookies.ts`), so customers are not signed out after a while. They are only signed out if they tap Sign out or clear browser data. In Supabase → Authentication → Sessions, leave "Time-box user sessions" and "Inactivity timeout" **off** (they are off by default).

## Good to know

- This project uses Next.js 16, which has changes from earlier versions. Check `node_modules/next/dist/docs/` before relying on older habits.
- The preloader (logo animation) plays on every fresh page load of the storefront.
- Orders are delivered within 48 hours and there is no returns flow. Admin and seller still have Returns screens that can be removed.
- Not built yet: a payment gateway, team invites in Admin → Settings, real analytics for visitors and traffic, and email verification.
