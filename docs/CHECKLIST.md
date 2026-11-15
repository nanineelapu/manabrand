# Mana Brand — Development Checklist

Fashion & apparel marketplace · India (₹, English) · **Next.js (App Router) frontend first, Supabase later.**
Mock data only. Mobile-first: every layout is designed at 390px, then *expanded* at `md` (768) and `lg` (1024+).

Legend: `[x]` todo · `[x]` done

---

## 0. Principles (non-negotiable)

- Mobile design is the source of truth; desktop adds columns/sidebars/hover, never the reverse.
- Three **surfaces**, one brand. Same logo, fonts, accent colour, radii family, icon set. Different shell, density, navigation and mood.
  | Surface | Mood | Mobile nav | Desktop nav | Density |
  |---|---|---|---|---|
  | Store (`/`) | Editorial, warm ivory, large imagery | Top bar + **bottom tab bar** + category sheet | Top bar + mega menu | Airy |
  | Admin (`/admin`) | Control room, dark ink sidebar, cool neutrals | Top bar + **drawer** + bottom quick-tabs | Fixed collapsible sidebar + command bar | Dense |
  | Seller (`/seller`) | Friendly workshop, marigold accent, task-led | Top bar + **bottom tabs + floating "Add product"** | Light sidebar + store-status header | Medium |
- Tokens live in **one place** (`src/app/globals.css` + `src/lib/design/tokens.ts`). No raw hex in components.
- All data goes through `src/lib/data/*` (async repository functions over `src/lib/mock/*`) so Supabase swaps in without touching UI.
- Server Components by default; `'use client'` only for interaction (sheets, steppers, filters, stores).
- Touch targets ≥ 44px, focus-visible rings, reduced-motion respected, semantic HTML, alt text.

## Status (15 Nov 2026)

Frontend phases 0–5 are built on mock data. Design decisions made with the owner: **fashion & apparel**, **India / ₹ / English**, brand identity designed in-house (ink + ivory + vermilion + marigold-gold, Fraunces display + DM Sans). Storefront header follows the owner's reference: dark translucent bar, gold wordmark, frosted pill nav, dark pill CTA with gold arrow disc.

Known demo shortcuts (all intentional, tracked for Phase 7): auth is UI-only; "current user" is a fixed mock customer; `/track-order` looks up any order number without phone verification; `cacheComponents` is off.

## 1. Phases

- [x] **Phase 0** — Inspect project, decide architecture, write this checklist
- [x] **Phase 1** — Foundation: deps, design tokens, fonts, utils, stores, UI primitives
- [x] **Phase 2** — Mock data + data-access layer + typed domain models
- [x] **Phase 3** — Customer storefront (mobile → desktop)
- [x] **Phase 4** — Admin dashboard
- [x] **Phase 5** — Seller portal
- [~] **Phase 6** — QA: typecheck ✔, lint ✔, production build ✔, all 68 routes crawled at 390px & 1440px ✔ (no console errors, no horizontal overflow), purchase flow click-tested ✔ — **still open:** click-through of admin/seller actions, tablet (768) pass ✔ (crawl at 320/390/768/1024/1440), screen-reader/a11y audit
- [x] **Phase 7** — Supabase backend: schema, RLS, phone+PIN auth, proxy, storage, server actions for every create/read/update/delete, motion + responsive polish (see `docs/SUPABASE_SETUP.md`). Needs a real Supabase project + `PAYMENT_MODE=live` gateway to go to production.

## 2. Folder structure

```
src/
  app/
    (store)/            customer site  — layout: StoreShell
    (auth)/             login / register / forgot — layout: minimal
    admin/              admin dashboard — layout: AdminShell
    seller/             seller portal   — layout: SellerShell
    globals.css         tokens + surface themes
  components/
    ui/                 primitives (Button, Input, Sheet, Tabs, Badge, DataTable…)
    brand/              Logo, ProductArt (SVG product imagery), Wordmark
    store/              customer components
    admin/              admin components
    seller/             seller components
    shared/             charts, stat cards, status badges, order timeline
  lib/
    design/             tokens.ts
    mock/               seed data (products, orders, customers, sellers…)
    data/               repository functions (async) — the Supabase seam
    stores/             zustand: cart, wishlist, toast, ui
    utils.ts            cn, formatINR, formatDate…
  types/                domain types
docs/CHECKLIST.md
```

## 3. Shared components

### UI primitives (`components/ui`)
- [x] Button (variants: primary, secondary, ghost, outline, danger; sizes; loading; icon) · IconButton
- [x] Input · Textarea · Select · Checkbox · Radio · Switch · Field (label/help/error)
- [x] SearchField · QuantityStepper · Chip/FilterChip · Badge · Avatar · Rating · Price (₹, MRP strike, % off)
- [x] Card · Section header · Breadcrumb · Pagination · EmptyState · Skeleton · Progress · Divider
- [x] Sheet (bottom sheet on mobile / side drawer on desktop) · Modal · Toast · Accordion · Tabs
- [x] DataTable (table ≥ md, **stacked cards < md**) · Stat card · Stepper (checkout) · Timeline (order tracking)
- [x] Charts (SVG, no dependency): Sparkline, Area/Line, Bars, Donut

### Brand (`components/brand`)
- [x] Logo / Wordmark (store, admin, seller variants)
- [x] ProductArt — deterministic SVG garment illustration per product (kurta, saree, dress, shirt, tee, jacket, jeans, sneaker, bag, lehenga) with palette; swappable for real `<Image>` later

## 4. Route map & required content

### 4.1 Customer storefront (`(store)`)
Shell: AnnouncementBar · Header (menu, logo, search, wishlist, bag) · MobileTabBar (<lg) · MegaNav (lg) · Footer · CategorySheet · MiniCart sheet

- [x] `/` Home — hero carousel, category rail, new arrivals, trending, collections/editorial, offer strip, seller spotlight, testimonials, newsletter, trust badges
- [x] `/shop` — listing: sort, filter bottom-sheet (mobile) / sidebar (lg), active chips, grid 2→3→4, load-more
- [x] `/category/[slug]` — same listing scoped, with category banner + subcategory chips
- [x] `/collections` · `/collections/[slug]`
- [x] `/new` · `/sale`
- [x] `/product/[slug]` — swipe gallery + thumbs, title/price/rating, colour swatches, size selector + size-guide sheet, pincode check, delivery/returns info, accordion (details, fabric, care), reviews summary + list, seller card, related products, **sticky mobile CTA**
- [x] `/search` — query field, recent/trending chips, results
- [x] `/cart` — line items (stepper, remove, move to wishlist), coupon, price breakdown, free-shipping progress, sticky checkout bar
- [x] `/checkout` — stepper: Address → Delivery → Payment (UPI/Card/COD/Netbanking), order summary (collapsible on mobile)
- [x] `/order-confirmed/[id]` — success, summary, timeline preview
- [x] `/wishlist`
- [x] `/account` (hub) · `/account/orders` · `/account/orders/[id]` (tracking, invoice, return) · `/account/addresses` · `/account/profile` · `/account/returns`
- [x] `/track-order`
- [x] `/sellers/[slug]` — public seller storefront
- [x] Info: `/about` · `/contact` · `/faq` · `/size-guide` · `/shipping-returns` · `/privacy` · `/terms`
- [x] `not-found` · `error` · `loading` states

### 4.2 Auth (`(auth)`)
- [x] `/login` · `/register` · `/forgot-password` (phone/email, social buttons, OTP-style UI)

### 4.3 Admin (`/admin`)
Shell: Sidebar (desktop, collapsible) · Drawer (mobile) · bottom quick-tabs · Topbar (search, notifications, profile)
- [x] `/admin/login`
- [x] `/admin` Dashboard — KPI cards, revenue chart, orders by status, top products, top sellers, recent orders, low-stock, pending approvals
- [x] `/admin/orders` (filters, status tabs, table→cards) · `/admin/orders/[id]` (items, customer, payment, status update, timeline)
- [x] `/admin/products` · `/admin/products/new` · `/admin/products/[id]`
- [x] `/admin/categories`
- [x] `/admin/customers` · `/admin/customers/[id]`
- [x] `/admin/sellers` (+ approval queue) · `/admin/sellers/[id]`
- [x] `/admin/payouts`
- [x] `/admin/returns`
- [x] `/admin/coupons`
- [x] `/admin/banners` (homepage content)
- [x] `/admin/reviews` (moderation)
- [x] `/admin/analytics`
- [x] `/admin/settings`

### 4.4 Seller portal (`/seller`)
Shell: Sidebar (desktop) · bottom tabs + FAB (mobile) · store-status toggle
- [x] `/seller/login` · `/seller/register` (3-step onboarding)
- [x] `/seller` Dashboard — today's tasks, sales snapshot, orders to ship, low stock, payout card, tips
- [x] `/seller/orders` · `/seller/orders/[id]` (pack/ship flow, label)
- [x] `/seller/products` · `/seller/products/new` · `/seller/products/[id]`
- [x] `/seller/inventory`
- [x] `/seller/earnings` (balance, payouts, statements)
- [x] `/seller/returns`
- [x] `/seller/reviews`
- [x] `/seller/promotions`
- [x] `/seller/analytics`
- [x] `/seller/profile` (store settings, KYC, bank)
- [x] `/seller/support`

## 5. Interactions to implement (all mock-backed)

- [x] Add to bag / quantity / remove / move to wishlist (persisted in localStorage)
- [x] Wishlist toggle with heart animation + toast
- [x] Size/colour selection with validation ("Select a size")
- [x] Filters (category, price, size, colour, brand, rating, discount) + sort — URL-driven
- [x] Coupon apply/remove (valid & invalid codes)
- [x] Checkout step validation, payment method switch, place order → confirmation
- [x] Pincode serviceability check
- [x] Bottom sheets / drawers / modals with focus trap + Esc
- [x] Admin/seller: tabs & status filters, order status update (local state), approve/reject seller, toggle product active, form validation
- [x] Toasts for every mutation

## 6. Mock data inventory
- [x] Categories (Women, Men, Kids, Ethnic, Western, Footwear, Accessories + subcategories)
- [x] ~36 products w/ variants (colours, sizes, stock), reviews, seller
- [x] 6 sellers · 24 customers · 40 orders (all statuses) · returns · coupons · banners · payouts · notifications · addresses

## 7. Done-criteria per page
Mobile (390) layout designed first → tablet → desktop · loading/empty/error states where relevant · keyboard accessible · no layout shift · uses only token colours/spacing · reuses shared components.
- [x] **CMS** — Sanity for site content only (menus, announcement bar, footer, home copy, titles/SEO, info pages + new pages). Embedded editor at `/studio`, webhook revalidation, built-in fallback when not connected. See `docs/SANITY_SETUP.md`.
