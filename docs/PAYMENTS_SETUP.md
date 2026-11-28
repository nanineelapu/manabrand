# Payments (Razorpay), stock alerts, cart reminders, review photos

## 1. Run the new SQL
Supabase → SQL Editor, in this order (after migrations 0001–0008):
1. `supabase/migrations/20261115000009_admin_tools.sql` — product SEO fields + Deal Box settings
2. `supabase/migrations/20261115000010_payments_alerts_reviews.sql` — back-in-stock alerts, cart reminders, review photos (+ the `review-images` storage bucket)

## 2. Online payments with Razorpay (the client does this part)
1. Create / log in to a Razorpay account (dashboard.razorpay.com) and finish KYC to go live. Use **Test Mode** first.
2. **API keys**: Account & Settings → API Keys → Generate. Copy the **Key Id** (`rzp_test_…` / `rzp_live_…`) and **Key Secret** (shown once).
3. **Webhook**: Account & Settings → Webhooks → Add:
   - URL: `https://manabrand.vercel.app/api/razorpay/webhook` (your real domain later)
   - Secret: type any long random string (this becomes `RAZORPAY_WEBHOOK_SECRET`)
   - Events: `payment.captured`, `order.paid`, `refund.processed`
4. **Environment variables** (Vercel → Settings → Environment Variables, and `.env.local` for local testing), then redeploy:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=the-secret-from-step-3
   PAYMENT_MODE=live
   ```
5. **Test**: place an order and choose UPI / Card. In Test Mode use Razorpay's test card `4111 1111 1111 1111` (any future expiry, any CVV) or UPI id `success@razorpay`. The order should turn **Paid**. Then in Admin → Orders → open the order → **Refund payment**.
6. **Go live**: switch the dashboard to Live Mode, generate live keys, replace the three values, redeploy.

How it works: the customer's order is created first, then Razorpay's window opens. If they close it, the order stays "payment pending" and shows a **Pay now** button on their order page. The webhook marks the order paid even if the browser closed after paying. Cancelling a paid order refunds it automatically; admins can also refund from the order page.

## 3. Back-in-stock alerts
On a sold-out product or size, shoppers can type their email. When stock is added (Admin → Inventory, or editing the product), they get one email and the alert is removed.

## 4. Abandoned-cart emails
Signed-in shoppers' bags are saved in the database. A daily job (`vercel.json`, 5:00 PM India time) emails each customer **once** about a bag left 3–72 hours ago with nothing bought since (only if their "offers" preference is on). Needs a secret so only Vercel can run it:
```
CRON_SECRET=any-long-random-string      # add in Vercel → Environment Variables, then redeploy
```
Vercel's free plan allows daily jobs; hourly needs the Pro plan. Emails need Resend set up — see `EMAIL_SETUP.md`.

## 5. Review photos
Customers can attach up to 3 photos (JPG/PNG/WebP, 4 MB each) when reviewing a product they received. Photos are stored in the `review-images` bucket, each customer in their own folder, and show on the review once it is approved.

## 6. Exchanges (no refunds)
ManaBrand has **no refund policy**. A delivered item can only be **exchanged**, within **7 days of delivery** (the database enforces the 7 days and refuses anything but an exchange). Completing an exchange never touches the payment. The only money that goes back is for an order **cancelled before it is packed**: wallet money returns to the wallet and an online payment is reversed through Razorpay automatically. The wording on the Shipping & exchanges page, FAQ and Terms is a sensible default - confirm it with the client.
