# Sanity CMS — editing the website's content

Sanity is used **only for site content** — the words, menus and pages. Everything that changes with orders
(products, stock, prices, categories, banners, coupons, orders …) stays in Supabase and is still managed in `/admin`.

| Edited in Sanity (`/studio`) | Still edited in Admin (Supabase) |
|---|---|
| Header menu: names, order, links, which items get a category dropdown | Products, stock, prices, photos |
| Footer columns & links, phone-menu quick links | Categories & sub-categories |
| Announcement bar messages | Homepage banners, coupons |
| Home-page headline, buttons, hero photo, quote, section titles | Orders, returns, payouts, sellers, customers |
| Browser-tab titles, Google description, social-share image | |
| Footer text, copyright, support phone/email, social links | |
| Pages: About, FAQs, Privacy, Terms, Shipping & returns — and **brand-new pages** (get their own `/address`) | |

Nothing breaks if Sanity is empty or not connected: every field falls back to the built-in text. Fill in only what you want to change.

---

## 1. Create the Sanity project (5 minutes, free plan is enough)
1. Go to **sanity.io/manage** → **Create project** → name it *Mana Brand*, dataset **production**.
2. Copy the **Project ID** (shown at the top of the project page).

## 2. Connect it
Add to `.env.local` (and to your hosting provider's environment variables):
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_REVALIDATE_SECRET=any-long-random-string
```
Restart `npm run dev`.

## 3. Allow the editor to run on your site
In **sanity.io/manage → your project → API → CORS origins** add (tick *Allow credentials*):
- `http://localhost:3000`
- your live domain, e.g. `https://www.manabrand.in`

## 4. Open the editor
Go to **`/studio`** (or Admin → *Site content* → *Open content editor*) and sign in with Google / GitHub / email.
Start with the three single documents:
1. **Site settings** — titles, announcement bar, footer & contact
2. **Navigation** — header menu, footer columns, phone-menu links
3. **Home page** — headline, buttons, photo, section titles

Press **Publish** after each change.

### Header menu
Leave **Header menu** empty and the site builds it automatically (New · each category · Sale).
Add items and you control everything: order, names, where each goes, gold highlight, phone-only / desktop-only,
and a **category dropdown** (type the category's slug, e.g. `electronics` — its sub-categories fill in automatically).

### Pages
*Pages → New.* Give it a title and an address, write the content, add FAQ groups / number highlights / buttons if you like.
- A page called **`gift-cards`** appears at `/gift-cards`. Link to it from the Navigation (choose *A page from the CMS*).
- Addresses `about`, `faq`, `privacy`, `terms`, `shipping-returns` **replace the built-in pages** of the same name.
- Addresses used by the shop itself (`shop`, `cart`, `account`, …) are refused by the editor.

## 5. Make edits appear instantly (webhook)
Without this, changes still appear within ~2 minutes. For instant updates:
**sanity.io/manage → API → Webhooks → Create webhook**
| Field | Value |
|---|---|
| URL | `https://YOUR-DOMAIN/api/revalidate` |
| Dataset | production |
| Trigger on | Create, Update, Delete |
| Filter | *(leave empty)* |
| Projection | `{_type}` |
| HTTP method | POST |
| Secret | the same value as `SANITY_REVALIDATE_SECRET` |

(On localhost the webhook can't reach you — the 2-minute refresh is fine for development.)

## 6. Add your team
**sanity.io/manage → Members → Invite.** *Editor* can change content; *Administrator* can also manage the project.
The studio is protected by Sanity's own sign-in — it is **not** tied to the Mana admin login.

## Troubleshooting
- **`/studio` says "not connected yet"** → `NEXT_PUBLIC_SANITY_PROJECT_ID` is missing; restart the dev server after adding it.
- **Studio loads but is blank / "CORS" error** → add the site's address in step 3.
- **I published but the site didn't change** → wait up to 2 minutes, or set up the webhook (step 5). Drafts (unpublished) never show.
- **Dataset set to private** → create a read token (API → Tokens, *Viewer*) and set `SANITY_API_READ_TOKEN`.

## For developers
- Schemas: `src/sanity/schemaTypes/` · studio config: `sanity.config.ts` · embedded at `src/app/studio/[[...tool]]`
- Content layer (queries, merge with built-in defaults): `src/lib/cms/` — change the built-in copy in `src/lib/cms/defaults.ts`
- Cached 2 min and tagged `sanity:<type>`; `/api/revalidate` expires the tag on publish.
- `npm run cms:test` checks every query against a sample dataset (no Sanity account needed).

---

## Live site on Vercel (manabrand.vercel.app)

`.env.local` only works on your computer. The live site reads its own copy of the settings in Vercel.

1. **Vercel → your project → Settings → Environment Variables.** Add (for Production, Preview and Development):
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SANITY_PROJECT_ID` | the Project ID from sanity.io/manage (e.g. `ab12cd34`) |
   | `NEXT_PUBLIC_SANITY_DATASET` | `production` |
   | `SANITY_REVALIDATE_SECRET` | the same long random string you use in the Sanity webhook |
   | `SANITY_API_READ_TOKEN` | only if the dataset is **private** (Sanity → API → Tokens → Viewer) |
2. **Redeploy** (Deployments → the latest → ⋯ → Redeploy). `NEXT_PUBLIC_…` values are baked in when the site is built, so a new deployment is required after adding them.
3. **Sanity → API → CORS origins:** add `https://manabrand.vercel.app` with **Allow credentials** ticked (and `http://localhost:3000` for local work).
4. **Sanity → API → Webhooks:** URL `https://manabrand.vercel.app/api/revalidate`, secret = `SANITY_REVALIDATE_SECRET`, on create / update / delete.
5. Open `https://manabrand.vercel.app/studio` and sign in with the Google/GitHub/email account that is a member of the Sanity project.

