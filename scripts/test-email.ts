/**
 * Email check.   npm run email:test                      → writes every template to ./email-preview/*.html (open in a browser)
 *                npm run email:test -- you@example.com   → ALSO sends all of them to that address through Resend
 * Needs RESEND_API_KEY and EMAIL_FROM in .env.local to send. Nothing is sent without an address.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import * as t from "../src/lib/email/templates";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const to = process.argv[2];
const order = { name: "Ananya Rao", number: "MB-10512", total: 3597, subtotal: 3498, shipping: 99, discount: 0, paymentMethod: "cod", siteUrl: SITE,
  items: [{ name: "Floral Wrap Midi Dress", qty: 1, price: 2699, size: "M", color: "Marigold" }, { name: "Soft Knit Everyday Tee", qty: 1, price: 899, size: "S", color: "Dusty Rose" }],
  address: { name: "Ananya Rao", line1: "12 Main Road", city: "Ichapuram", state: "Andhra Pradesh", pincode: "532312", phone: "+919876543210" } };

const mails: [string, t.Mail | null][] = [
  ["welcome", t.welcomeEmail("Ananya Rao", SITE)],
  ["order-confirmed", t.orderConfirmedEmail(order)],
  ["order-shipped", t.orderStatusEmail({ name: "Ananya Rao", number: "MB-10512", status: "shipped", awb: "DL123456789", courier: "Delhivery", siteUrl: SITE })],
  ["order-delivered", t.orderStatusEmail({ name: "Ananya Rao", number: "MB-10512", status: "delivered", siteUrl: SITE })],
  ["order-cancelled", t.orderStatusEmail({ name: "Ananya Rao", number: "MB-10512", status: "cancelled", siteUrl: SITE })],
  ["return-approved", t.returnUpdateEmail({ name: "Ananya Rao", number: "MB-10512", status: "approved", siteUrl: SITE })],
  ["newsletter", t.newsletterWelcomeEmail(SITE)],
  ["contact-ack", t.contactAckEmail({ name: "Ananya Rao", topic: "Order status", message: "Where is my order?\nIt was due yesterday.", siteUrl: SITE })],
  ["contact-inbox", t.contactInboxEmail({ name: "Ananya Rao", email: "ananya@example.com", phone: "+919876543210", order: "MB-10512", topic: "Order status", message: "Where is my order?", siteUrl: SITE })],
  ["seller-applied", t.sellerAppliedEmail({ store: "Saanjh Studio", owner: "Priya Nair", siteUrl: SITE })],
  ["seller-applied-admin", t.sellerAppliedAdminEmail({ store: "Saanjh Studio", owner: "Priya Nair", city: "Ichapuram", siteUrl: SITE })],
  ["seller-approved", t.sellerDecisionEmail({ store: "Saanjh Studio", owner: "Priya Nair", status: "active", siteUrl: SITE })],
];

async function main() {
  mkdirSync("email-preview", { recursive: true });
  let sent = 0, failed = 0;
  for (const [name, m] of mails) {
    if (!m) { console.log(`SKIP  ${name}`); continue; }
    writeFileSync(`email-preview/${name}.html`, m.html);
    if (!to) { console.log(`wrote email-preview/${name}.html`); continue; }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "ManaBrand <care@manabrand.in>", to, subject: `[TEST] ${m.subject}`, html: m.html, text: m.text }),
    });
    if (res.ok) { sent++; console.log(`PASS  sent ${name}`); } else { failed++; console.log(`FAIL  ${name}: ${res.status} ${(await res.text()).slice(0, 200)}`); }
    await new Promise((r) => setTimeout(r, 600)); // stay under Resend's rate limit
  }
  if (to) console.log(`\n${sent} sent, ${failed} failed`);
  return failed;
}
main().then((failed) => process.exit(failed ? 1 : 0));
