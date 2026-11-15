# Mana Brand — Backend & Database Handoff

**Audience:** whoever builds the Supabase backend (and the owner deciding what to build).
**State today:** a complete Next.js 16 (App Router) frontend running on **mock data only**. **No backend exists yet** — nothing is connected to Supabase, no auth, no payments, no file storage. Every number, order and product on screen comes from `src/lib/mock/*`.

---

## 1. What is built (frontend)

Mobile-first multi-category **marketplace for India** (₹): Fashion, Electronics, Home, Beauty, Accessories, Gourmet. Three surfaces, one brand, glass theme, all rectangular UI.

| Surface | Routes | Who uses it |
|---|---|---|
| **Storefront** `/` | `/`, `/shop`, `/category/[slug]`, `/collections`, `/collections/[slug]`, `/new`, `/sale`, `/search`, `/product/[slug]`, `/cart`, `/checkout`, `/order-confirmed/[id]`, `/wishlist`, `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses`, `/account/profile`, `/account/returns`, `/track-order`, `/sellers/[slug]`, `/about`, `/contact`, `/faq`, `/size-guide`, `/shipping-returns`, `/privacy`, `/terms` | Shoppers |
| **Auth** | `/login` (mobile OTP or email+password, Google button), `/register`, `/forgot-password` | Shoppers |
| **Admin** `/admin` | `/login`, dashboard, orders (+detail), products (+new/edit), categories, customers (+detail), sellers (+detail, approval), payouts, returns, coupons, banners, reviews (moderation), analytics, settings | Mana staff |
| **Seller** `/seller` | `/login`, `/register` (3-step onboarding), dashboard, orders (+detail), products (+new/edit), inventory, earnings, returns, reviews, promotions, analytics, profile, support | Marketplace sellers |

**Frontend conventions the backend must respect**
- All reads go through **`src/lib/data/index.ts`** (async functions). Replace the bodies with Supabase queries; keep signatures → **no UI changes needed**.
- Types in **`src/types/index.ts`** mirror the tables below 1:1 (camelCase in app, snake_case in DB).
- Prices are **integer rupees** (not paise). Keep that or tell the frontend to switch.
- Product photos use `src/lib/images.ts` (Unsplash IDs per product type) as a stand-in. Real uploads go to Supabase Storage and a `product.images[]` field must be added (see §5).

---

## 2. Users, roles and auth

Three roles on one Supabase Auth project:

| Role | How they sign in | Where |
|---|---|---|
| `customer` | Mobile **OTP** (primary), email + password, Google | `/login`, `/register` |
| `seller` | Email + password or OTP; account created via onboarding, **must be approved** before listing | `/seller/login`, `/seller/register` |
| `admin` (+ sub-roles Super admin / Operations / Support / Marketing) | Email + password (invite-only) | `/admin/login` |

Needed: `profiles` table linked to `auth.users` with `role`; route protection in **`proxy.ts`** (Next 16 replaced middleware) — `/admin/*` needs `admin`, `/seller/*` needs `seller` with `status='active'`, `/account/*` needs a session; admin-only invite flow; password reset email (the forgot-password screens exist).

Today: login screens are UI only and the "logged-in" shopper is a fixed mock customer (`getCurrentCustomer`); seller is fixed `CURRENT_SELLER_ID = "s1"`. Both must be replaced by the session user.

---

## 3. Database schema (proposed)

Enums: `seller_status (active, pending, suspended, rejected)`, `kyc_status (verified, pending, rejected)`, `product_status (active, draft, out_of_stock, pending_review)`, `order_status (placed, confirmed, packed, shipped, out_for_delivery, delivered, cancelled, returned)`, `payment_method (upi, card, cod, netbanking, wallet)`, `payment_status (paid, pending, refunded, failed)`, `return_type (return, exchange, refund)`, `return_status (requested, approved, picked_up, refunded, rejected)`, `coupon_type (percent, flat, shipping)`, `coupon_status (active, scheduled, expired, paused)`, `payout_status (paid, processing, scheduled, on_hold)`, `review_status (published, pending, flagged)`, `banner_status (live, scheduled, draft)`, `user_role (customer, seller, admin)`.

```sql
-- identity
profiles(id uuid pk → auth.users, role user_role, full_name, email, phone, dob date, tier text default 'New',
         status text default 'active', notify_orders bool, notify_offers bool, notify_whatsapp bool, created_at)
admin_members(user_id pk → profiles, admin_role text)             -- Super admin | Operations | Support | Marketing

-- catalogue
categories(id, slug unique, name, tagline, photo_kind, sort int)
subcategories(id, category_id → categories, name, sort)
sellers(id, owner_id → profiles, slug unique, name, owner_name, email, phone, city, state, status seller_status,
        kyc kyc_status, gstin, pan, bank_account_enc, ifsc, commission_pct numeric default 12, blurb, logo_url, banner_url,
        pickup_address, holiday_mode bool, joined_at)
seller_documents(id, seller_id, type, file_path, status)           -- PAN, GST cert, cancelled cheque, address proof
products(id, slug unique, seller_id, category_id, subcategory_id, name, description, price int, mrp int,
         option_label text,                                        -- Size | Storage | Volume | Pack | Config | Standard
         material text, care text[], details text[], tags text[], badges text[], status product_status,
         rating_avg numeric, review_count int, sold_count int, created_at, updated_at)
product_colors(id, product_id, name, hex)
product_options(id, product_id, value text, stock int)             -- one row per size/storage/volume (this is the inventory)
product_images(id, product_id, color_id null, url, sort, is_cover)
collections(id, slug, name, story) ; collection_products(collection_id, product_id, sort)
reviews(id, product_id, user_id, order_id, rating 1-5, title, body, status review_status, verified bool, helpful int, seller_reply, created_at)

-- shopping
addresses(id, user_id, label, name, phone, line1, line2, city, state, pincode, is_default)
carts(id, user_id) ; cart_items(id, cart_id, product_id, color_id, option_value, qty)     -- or keep in localStorage until login
wishlists(user_id, product_id, created_at)
coupons(id, code unique, description, type, value, min_order, max_discount, usage_limit, used_count, expires_at, status, seller_id null)

-- orders
orders(id, number text unique default 'MB-'||seq, user_id, status, subtotal, discount, shipping_fee, cod_fee, express_fee, total,
       coupon_code, payment_method, payment_status, payment_ref, address jsonb (snapshot), awb, courier, created_at)
order_items(id, order_id, product_id, seller_id, name, color, option_value, qty, price, photo_kind)   -- snapshot at purchase
order_events(id, order_id, status, note, created_at)               -- the timeline shown to customers
returns(id, order_id, order_item_id, seller_id, user_id, type, reason, note, status, amount, created_at)

-- marketplace money
payouts(id, seller_id, period_start, period_end, orders_count, gross, commission, net, status, utr, paid_at)
commission_rules(id, category_id null, seller_id null, pct)        -- optional overrides (Settings → Commission)

-- content & ops
banners(id, title, subtitle, cta, href, placement, status, photo_url/kind, starts_on, ends_on)
notifications(id, user_id/role, kind, title, body, read, created_at)
support_tickets(id, seller_id/user_id, topic, message, order_number, status, created_at) ; contact_messages(...)
newsletter_subscribers(email unique, created_at)
promotions(id, seller_id, name, percent, scope jsonb, ends_on, active)       -- seller-funded discounts
settings(key pk, value jsonb)                                                 -- shipping rules, payment toggles, GST, support contact
audit_log(id, actor_id, action, entity, entity_id, diff jsonb, created_at)    -- admin actions (recommended)
```

Indexes: `products(slug)`, `products(category_id, status)`, GIN full-text on `products(name, tags)`, `orders(user_id, created_at)`, `order_items(seller_id)`, `returns(seller_id, status)`.
Derived values (`rating_avg`, `review_count`, `sold_count`, seller `rating`, `followers`, `total_sales`, category `productCount`) → **views or triggers**, not hand-maintained.

---

## 4. Row-Level Security (RLS) — rules to implement

- **Public read:** active products, categories, collections, live banners, active sellers, published reviews.
- **Customer:** read/write only own `profiles`, `addresses`, `wishlists`, `carts`; read own `orders`/`order_items`/`order_events`/`returns`; create reviews only for products they bought (`verified`).
- **Seller:** CRUD only products where `seller_id` = theirs; read only `order_items` + the parent order lines for their `seller_id` (they must **not** see other sellers' lines, or full customer payment data — see `getOrdersForSeller`, which already strips lines and totals to the seller's share); read own payouts/returns/reviews; update own store profile; cannot set `status='active'` on a product or on themselves (admin approval).
- **Admin:** full access, gated by `admin_members`; every write logs to `audit_log`.
- **Service role only (never from the browser):** payments confirmation, payout release, refund, role changes, KYC verification, stock decrement.

---

## 5. Storage (Supabase buckets)

| Bucket | Public? | Used by |
|---|---|---|
| `product-images` | public read | Product form "Photos" (up to 6 per product, first = cover); add `images` to the `Product` type and have `ProductImage` render them, falling back to `lib/images.ts` |
| `seller-assets` | public read | Store logo + banner (Seller → Store profile) |
| `seller-kyc` | **private** (signed URLs, admin only) | PAN, GST certificate, cancelled cheque, address proof (onboarding Step 2) |
| `banners` | public read | Admin banners |

---

## 6. Backend operations the UI needs (beyond plain reads)

Each is a server action / RPC / edge function. **Bold = must be atomic/transactional.**

**Shopper**
1. **Place order** (checkout): validate cart prices server-side (never trust client totals), re-check stock, apply coupon rules (min order, max discount, usage limit, expiry), compute shipping (free ≥ ₹1,499 else ₹99; express +₹149; COD fee +₹40), create `orders` + `order_items` + first `order_events`, **decrement `product_options.stock`**, generate `MB-xxxxx` number, return payment intent. Today this is faked: ID is random and stored in `sessionStorage`.
2. Payment: create gateway order (**Razorpay recommended**: UPI/cards/netbanking/COD), verify signature via webhook → `payment_status`. UI has UPI ID, card and bank forms (frontend must switch to the gateway's checkout instead of collecting card data itself).
3. Coupon validate/apply (UI: `CouponBox`; codes in mock: WELCOME10, FESTIVE500, FREESHIP…). First-order rule for WELCOME10.
4. Pincode serviceability + ETA (UI: product page "Delivery options"; today a regex stub `ETA_DAYS`).
5. Cancel order (only `placed`/`confirmed`) → refund if paid; request return/exchange (7-day window, reason + note) from order page.
6. Cart sync after login (merge localStorage cart into DB); wishlist sync.
7. Track order by number (**must require phone/OTP verification** — today any order number works).
8. Search with suggestions (name, subcategory, seller, tags) — start with Postgres full-text; add trigram for typos.
9. Address CRUD, default address, profile update, notification preferences.
10. Newsletter signup (footer) and contact form (stores `contact_messages`, emails support).
11. Post review (after delivery), "helpful" vote; follow seller.

**Seller**
12. Onboarding submit: create `sellers` row `pending` + documents upload + notify admins.
13. Product create/update (goes to `pending_review` on first publish; admin approves) incl. variants, colours, stock per option, images.
14. Inventory edit (bulk update stock per option).
15. Order fulfilment: confirm → packed → shipped (**needs a courier integration**: create shipment, AWB + label PDF, pickup, tracking webhooks that insert `order_events` and move status). Delhivery/Shiprocket suggested.
16. Respond to return (approve / reject / mark picked up) → triggers refund by admin/finance.
17. Reply to reviews; create/pause promotions; support tickets; store profile & holiday mode; payout statements (PDF/CSV).

**Admin**
18. Approve/reject/suspend seller; set commission %; verify KYC.
19. Moderate products (approve `pending_review`), reviews (approve/remove), returns (approve/refund).
20. **Payout run** twice a month (1st–15th, 16th–end): per seller sum delivered, non-returned `order_items` → gross, commission, net; create `payouts` rows; release / hold / mark paid with UTR (bank payout via RazorpayX or manual CSV).
21. Orders: manual status change, cancel, internal notes (needs an `order_notes` table), export CSV.
22. Coupons, banners, categories (+sub-categories), customers (block/unblock), team invites & roles, settings (shipping rules, payment toggles, GSTIN, commission).
23. **Analytics** (dashboard, analytics page, seller analytics): daily revenue/orders/visitors, funnel (visits → views → add-to-bag → checkout → purchase), traffic sources, top cities, top products/sellers, return rate. Needs an **events table** (page views, add to cart) or an analytics tool; revenue/orders can be SQL views.
24. Notifications (bell icon in admin/seller): insert on new order, low stock (≤ threshold), seller application, payout, review flagged; deliver via Realtime.

**Messaging:** transactional SMS/OTP (MSG91/Twilio), email (Resend/SES) for order confirmation, shipped, delivered, return updates, password reset, seller approval; optional WhatsApp.

---

## 7. Mock function → Supabase replacement map (`src/lib/data/index.ts`)

| Function | Replace with |
|---|---|
| `queryProducts` (search/filter/sort/page, facets) | One SQL query / RPC: filters `category, sub, q, min, max, sizes(options), colors, sellers, rating, discount, collection, badge`; sorts `featured(sold), new, price-asc/desc, rating, discount`; returns items, total, pages, **facets** (options, colours, sellers, price range) |
| `getProduct`, `getProductById`, `getProductsByIds`, `getRelated`, `getNewArrivals`, `getTrending`, `getOnSale` | Product selects (+ colours, options, images joined) |
| `getCategories/getCategory/getSubcategories`, `getCollections/getCollection` | Simple selects |
| `getActiveSellers`, `getSellerBySlug/ById` | `sellers` where `status='active'` |
| `getProductReviews`, `ratingBreakdown` | `reviews` published + `group by rating` |
| `getHomeBanners`, `getStripBanner` | `banners` live within `starts_on..ends_on` |
| `getCoupon` + client `priceCart` in `src/lib/cart.ts` | Server-side coupon validation (client calc stays only for display) |
| `getCurrentCustomer`, `getMyOrders`, `getOrderByIdOrNumber`, `getMyAddresses`, `getMyReturns` | Same, scoped to `auth.uid()` |
| `getAdminDashboard`, `getAnalytics`, `getNotifications` | SQL views / RPC |
| `getAllOrders/Customers/Sellers/Products/Payouts/Returns/Coupons/Banners/Reviews`, `getCustomerById`, `getOrdersForCustomer` | Admin-role selects with pagination (lists are unpaginated today) |
| `getOrdersForSeller`, `getSellerDashboard`, `getSellerProducts/Payouts/Returns/Reviews` | Seller-scoped selects (`seller_id = current seller`) |

**Mutations currently local-only (UI state, no persistence)** — every toast like "saved", "approved", "released" is fake: order status updates, seller approve/reject, payout release, return decisions, coupon/banner/category create-edit, product form save, inventory save, profile/address forms, review moderation, promotions, support tickets, settings. Each needs a server action; the forms already validate on the client (mirror those rules server-side).

**Client storage to retire:** `localStorage` keys `mana-cart`, `mana-wishlist`, `mana-recent` (`src/lib/stores/index.ts`) → keep as offline cache but sync with DB after login; `sessionStorage` `mana-last-order` (`order-confirmed.tsx`) → fetch the order by id instead.

---

## 8. Business rules already encoded in the UI (backend must match)

- Free shipping ≥ **₹1,499**, else ₹99; express ₹149; COD fee ₹40.
- Returns: **7 days** after delivery; not for opened beauty/gourmet items.
- Marketplace commission default **12%** (seller-specific overrides exist, e.g. 8–14%); payouts **T+2** after cycle close, twice monthly.
- Seller can only cancel `placed`/`confirmed`; status flow `placed → confirmed → packed → shipped → out_for_delivery → delivered`.
- Order number format `MB-10482`; GST invoice per order; GSTIN validated as 15-char Indian GSTIN; PAN `ABCDE1234F`; IFSC `HDFC0001234`; pincode 6 digits; mobile 10-digit Indian.
- Stock is **per option value** (size / storage / volume / pack); out-of-stock options are disabled on the product page; low-stock warning at ≤ 5 (shopper) and ≤ 12–30 (admin/seller alerts).
- One seller per product; a single order can contain **multiple sellers** (each seller sees and is paid only for their own lines).

---

## 9. Suggested build order

1. Supabase project, schema + enums, RLS, seed script from `src/lib/mock/*` (export mock data to SQL/JSON so the catalogue matches the UI).
2. Auth + `profiles` + roles + `proxy.ts` route guards.
3. Swap read functions in `src/lib/data` (catalogue first), then `/account` reads.
4. Cart/wishlist sync, addresses, **place order + Razorpay**, order emails.
5. Seller onboarding + product CRUD + Storage uploads + admin approval.
6. Fulfilment (courier API), returns/refunds, reviews.
7. Payout engine + admin finance screens.
8. Analytics events, notifications, search tuning, audit log, rate limiting, backups.

## 10. Decisions needed from the owner

1. **Payment gateway** (Razorpay assumed) and whether COD is offered at launch.
2. **Courier/shipping** partner (Delhivery, Shiprocket…) and who ships: sellers (current UI) or a central warehouse?
3. **Commission & payout** rules: 12% default OK? GST/TCS handling? Payout provider (RazorpayX vs manual bank file)?
4. **OTP/SMS & email providers**.
5. **Seller KYC**: manual review by admin (assumed) or automated verification?
6. Currency stored as **rupees** (assumed) vs paise.
7. Launch scope: are **Mana Cash/wallet**, seller **promotions**, **follow seller**, and **WhatsApp updates** (all drawn in the UI) in v1 or later? (They are UI-only today.)
8. Data retention / privacy (DPDP Act) requirements for customer data and KYC documents.
