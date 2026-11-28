# Email setup (Resend)

ManaBrand sends email through [Resend](https://resend.com). Without a key nothing is sent — mail is only printed in the server console, so local development is safe.

## What gets sent, and when

| Email | Sent to | Trigger |
|---|---|---|
| Welcome | Customer | Registers |
| Order confirmed (items, totals, address) | Customer | Order placed |
| Shipped / Out for delivery / Delivered / Cancelled | Customer | Seller or admin moves the order, or the customer cancels (respects the "order updates" setting in their account) |
| Return update | Customer | Return approved / picked up / refunded / rejected |
| Welcome + `WELCOME10` code | Subscriber | First-time newsletter sign-up |
| Message received (auto-reply) | Customer | Contact form |
| New contact message (Reply goes to the customer) | `SUPPORT_EMAIL` inbox | Contact form |
| Application received | Seller | Seller registers |
| New seller application | `SUPPORT_EMAIL` inbox | Seller registers |
| Store approved / suspended / rejected | Seller | Admin changes the store status |
| PIN-reset link | Customer | "Forgot PIN" — sent by **Supabase Auth**, see step 6 |

Templates live in `src/lib/email/templates.ts`; the "when" is in `src/lib/email/notify.ts`; the sender is `src/lib/email/send.ts`.
No email ever contains a PIN or password.

## Steps

1. **Create a Resend account** at resend.com (free: 3,000 emails/month, 100/day).
2. **Add your domain**: Resend → *Domains* → *Add Domain* (e.g. `manabrand.co.in`; a subdomain such as `mail.manabrand.co.in` also works).
3. **Add the DNS records** Resend shows (SPF `TXT`, DKIM `TXT`, and the MX for bounces) at your domain registrar, then click *Verify*. This usually takes a few minutes, up to a day. Add a DMARC record (`_dmarc` TXT, `v=DMARC1; p=none; rua=mailto:care@manabrand.co.in`) too — Gmail and Yahoo expect it.
4. **Create an API key**: Resend → *API Keys* → *Create* → permission **Sending access**. Copy it once.
5. **Set the environment variables** — in `.env.local` for local work and in your host (Vercel → Settings → Environment Variables) for production:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   EMAIL_FROM=ManaBrand <care@manabrand.co.in>      # must be on the verified domain
   SUPPORT_EMAIL=care@manabrand.co.in               # the inbox that receives contact-form messages
   NEXT_PUBLIC_SITE_URL=https://your-domain.com  # used for the links inside emails
   ```
   Redeploy after changing them. Make sure `care@manabrand.co.in` is a real inbox you read.
6. **PIN-reset emails (Supabase)**: Supabase sends these itself. Supabase dashboard → *Authentication → Emails → SMTP Settings* → turn on **Custom SMTP**:
   host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key, sender = your `EMAIL_FROM` address. Then edit *Authentication → Emails → Templates → Reset password* so the text talks about resetting a **PIN** and links to `{{ .ConfirmationURL }}`.
7. **Test it**:
   ```
   npm run email:test                    # writes every template to ./email-preview/*.html — open them in a browser
   npm run email:test -- you@gmail.com   # also sends all of them to that address through Resend
   ```
   Then place a real test order and submit the contact form. If something does not arrive, look at Resend → *Logs* and the server log lines starting with `[email]`.

## Notes

- Emails are fire-and-forget: a failed email never breaks an order or a sign-up. Failures are logged as `[email] …`.
- Spam folder? Check SPF/DKIM show *Verified* in Resend, and that `EMAIL_FROM` uses exactly that domain.
- The free plan allows 100 emails a day. If you grow past that, upgrade the Resend plan.
- WhatsApp / SMS order updates are not built yet (the account page has the toggle, but nothing sends).
