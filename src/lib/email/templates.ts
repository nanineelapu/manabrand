/**
 * Every email ManaBrand sends. Pure functions (no server-only imports) so they can be previewed and tested anywhere.
 * Rules: never put a PIN or password in an email. Inline styles + tables only (email clients ignore the rest).
 */
export interface Mail { subject: string; html: string; text: string }

const BRAND = { pink: "#e0247a", ink: "#0b0b0d", muted: "#6b6b73", line: "#ececf0", bg: "#f5f5f7" };
const SUPPORT = { email: "care@manabrand.in", phone: "+91 831 765 8309", hours: "Mon–Sat, 9am–8pm" };

/** Escape anything a customer typed before it goes into HTML. */
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;
const strip = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<br\s*\/?>|<\/p>|<\/tr>|<\/h\d>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr><td style="background:${BRAND.pink};border-radius:10px"><a href="${esc(href)}" style="display:inline-block;padding:13px 26px;color:#fff;font-weight:700;font-size:15px;text-decoration:none">${esc(label)}</a></td></tr></table>`;

/** The shared shell: black header, white card, small footer. `preheader` is the grey preview text in the inbox list. */
function layout(o: { title: string; preheader: string; body: string; siteUrl: string; reason?: string }): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="background:${BRAND.ink};border-radius:16px 16px 0 0;padding:22px 28px">
      <a href="${esc(o.siteUrl)}" style="text-decoration:none"><span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#fff">Mana</span><span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:${BRAND.pink}">Brand</span></a>
    </td></tr>
    <tr><td style="background:#fff;padding:30px 28px;border-radius:0 0 16px 16px;font-size:15px;line-height:1.6">${o.body}</td></tr>
    <tr><td style="padding:18px 8px;font-size:12px;line-height:1.6;color:${BRAND.muted};text-align:center">
      Questions? Write to <a href="mailto:${SUPPORT.email}" style="color:${BRAND.muted}">${SUPPORT.email}</a> or call ${SUPPORT.phone} (${SUPPORT.hours}).<br>
      ManaBrand · Ichapuram, Srikakulam, Andhra Pradesh 532312<br>
      ${o.reason ? esc(o.reason) + "<br>" : ""}We will never ask for your PIN or password by email.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const mail = (subject: string, html: string): Mail => ({ subject, html, text: strip(html) });
const h = (t: string) => `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3">${t}</h1>`;
const p = (t: string) => `<p style="margin:0 0 14px">${t}</p>`;

/* ------------------------------------------------------------------ customers */
export const welcomeEmail = (name: string, siteUrl: string): Mail => mail("Welcome to ManaBrand", layout({
  title: "Welcome to ManaBrand", preheader: "Your account is ready — start shopping local fashion.", siteUrl,
  body: h(`Welcome, ${esc(name.split(" ")[0])} 👋`) + p("Your ManaBrand account is ready. Sign in any time with your <b>mobile number and 4-digit PIN</b>.") +
    p("Order updates and receipts will come to this email address.") + button(`${siteUrl}/shop`, "Start shopping"),
}));

export interface OrderMail {
  name: string; number: string; total: number; paymentMethod: string; siteUrl: string;
  items: { name: string; qty: number; price: number; size?: string; color?: string }[];
  address?: { name?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string; phone?: string };
  subtotal?: number; shipping?: number; discount?: number;
}
const PAY: Record<string, string> = { cod: "Cash on delivery", upi: "UPI", card: "Card", netbanking: "Net banking", wallet: "Wallet" };

export const orderConfirmedEmail = (o: OrderMail): Mail => {
  const rows = o.items.map((i) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${BRAND.line}"><b>${esc(i.name)}</b><br><span style="color:${BRAND.muted};font-size:13px">${[i.color, i.size && `Size ${i.size}`, `Qty ${i.qty}`].filter(Boolean).map(esc).join(" · ")}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.line};white-space:nowrap">${inr(i.price * i.qty)}</td></tr>`).join("");
  const line = (l: string, v: string, bold = false) => `<tr><td style="padding:3px 0;${bold ? "font-weight:800;font-size:16px" : "color:" + BRAND.muted}">${l}</td><td align="right" style="padding:3px 0;${bold ? "font-weight:800;font-size:16px" : ""}">${v}</td></tr>`;
  const a = o.address;
  const addr = a ? [a.name, a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.pincode, a.phone && `Phone: ${a.phone}`].filter(Boolean).map(esc).join("<br>") : "";
  return mail(`Order ${o.number} confirmed`, layout({
    title: `Order ${o.number} confirmed`, preheader: `Thanks ${o.name.split(" ")[0]} — your order ${o.number} is placed. Delivery within 48 hours.`, siteUrl: o.siteUrl,
    reason: "You are receiving this because you placed an order on ManaBrand.",
    body: h("Thank you — your order is placed ✅") + p(`Hi ${esc(o.name.split(" ")[0])}, we have received order <b>${esc(o.number)}</b>. It will be delivered within <b>48 hours</b>.`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 10px">${rows}</table>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px">${o.subtotal != null ? line("Items", inr(o.subtotal)) : ""}${o.discount ? line("Discount", "− " + inr(o.discount)) : ""}${o.shipping != null ? line("Delivery", o.shipping ? inr(o.shipping) : "Free") : ""}${line("Total", inr(o.total), true)}</table>` +
      p(`<b>Payment:</b> ${esc(PAY[o.paymentMethod] ?? o.paymentMethod)}${o.paymentMethod === "cod" ? " — please keep " + inr(o.total) + " ready at delivery." : ""}`) +
      (addr ? p(`<b>Delivering to</b><br>${addr}`) : "") + button(`${o.siteUrl}/account/orders`, "Track your order"),
  }));
};

const STATUS_COPY: Record<string, { subject: string; head: string; body: string }> = {
  shipped: { subject: "is on its way", head: "Your order is on its way 🚚", body: "Your order has been handed to the courier." },
  out_for_delivery: { subject: "is out for delivery", head: "Out for delivery today 📦", body: "Your order will reach you today. Please keep your phone nearby." },
  delivered: { subject: "was delivered", head: "Delivered — enjoy! 🎉", body: "Your order has been delivered. We hope you love it." },
  cancelled: { subject: "was cancelled", head: "Your order was cancelled", body: "Your order has been cancelled. If you paid online, the refund goes back to the same method." },
  returned: { subject: "was returned", head: "Return received", body: "We have received your returned order." },
};
/** Statuses that are worth an email (the quiet in-between steps — confirmed, packed — are not). */
export const EMAIL_STATUSES = Object.keys(STATUS_COPY);

export const orderStatusEmail = (o: { name: string; number: string; status: string; awb?: string | null; courier?: string | null; siteUrl: string }): Mail | null => {
  const c = STATUS_COPY[o.status]; if (!c) return null;
  const track = o.awb ? p(`<b>${esc(o.courier ?? "Courier")}</b> tracking number: <b>${esc(o.awb)}</b>`) : "";
  return mail(`Order ${o.number} ${c.subject}`, layout({
    title: `Order ${o.number} ${c.subject}`, preheader: `Order ${o.number} ${c.subject}.`, siteUrl: o.siteUrl,
    reason: "You are receiving this because of an order on ManaBrand.",
    body: h(c.head) + p(`Hi ${esc(o.name.split(" ")[0])}, ${c.body}`) + p(`Order number: <b>${esc(o.number)}</b>`) + track + button(`${o.siteUrl}/account/orders`, "View order"),
  }));
};

const RETURN_COPY: Record<string, string> = {
  approved: "Your request has been approved. We will arrange the pickup shortly.",
  picked_up: "We have picked up your item and it is on its way back to the seller.",
  refunded: "Your refund has been processed. It can take a few working days to show in your account.",
  rejected: "We could not approve this request. Write to us if you would like us to look at it again.",
};
export const returnUpdateEmail = (o: { name: string; number: string; status: string; siteUrl: string }): Mail | null => {
  const t = RETURN_COPY[o.status]; if (!t) return null;
  return mail(`Update on your return for order ${o.number}`, layout({
    title: "Return update", preheader: t, siteUrl: o.siteUrl, reason: "You are receiving this because you asked for a return on ManaBrand.",
    body: h("An update on your return") + p(`Hi ${esc(o.name.split(" ")[0])}, ${t}`) + p(`Order number: <b>${esc(o.number)}</b>`) + button(`${o.siteUrl}/account/returns`, "See your returns"),
  }));
};

export const newsletterWelcomeEmail = (siteUrl: string): Mail => mail("You’re in — 10% off your first order", layout({
  title: "Welcome to the ManaBrand list", preheader: "Use WELCOME10 for 10% off your first order.", siteUrl,
  reason: "You are receiving this because you joined the ManaBrand list.",
  body: h("You’re on the list 💌") + p("Thanks for joining. Here is your welcome offer:") +
    `<div style="margin:6px 0 14px;padding:16px;border:2px dashed ${BRAND.pink};border-radius:12px;text-align:center"><div style="font-size:13px;color:${BRAND.muted}">10% off your first order</div><div style="font-size:26px;font-weight:900;letter-spacing:3px;color:${BRAND.pink}">WELCOME10</div></div>` +
    p("We will only email you about new arrivals and the occasional offer.") + button(`${siteUrl}/shop`, "Shop now"),
}));

/* -------------------------------------------------------------------- contact */
export const contactAckEmail = (o: { name: string; topic: string; message: string; siteUrl: string }): Mail => mail("We got your message", layout({
  title: "We got your message", preheader: "Thanks for writing to ManaBrand — we reply within 24 hours.", siteUrl: o.siteUrl,
  reason: "You are receiving this because you contacted ManaBrand.",
  body: h("Thanks for writing to us") + p(`Hi ${esc(o.name.split(" ")[0])}, we have your message and will reply within <b>24 hours</b> (${SUPPORT.hours}).`) +
    `<div style="margin:6px 0 14px;padding:14px 16px;background:${BRAND.bg};border-radius:10px;font-size:14px"><b>${esc(o.topic)}</b><br>${esc(o.message).replace(/\n/g, "<br>")}</div>` +
    p("For anything urgent, call or WhatsApp us on " + SUPPORT.phone + "."),
}));

/** To the ManaBrand inbox. Send with reply_to = the customer so "Reply" just works. */
export const contactInboxEmail = (o: { name: string; email: string; phone?: string; order?: string; topic: string; message: string; siteUrl: string }): Mail => mail(`[Contact] ${o.topic} — ${o.name}`, layout({
  title: "New contact message", preheader: `${o.name}: ${o.message.slice(0, 80)}`, siteUrl: o.siteUrl,
  body: h("New message from the contact form") +
    p(`<b>${esc(o.name)}</b> &lt;${esc(o.email)}&gt;${o.phone ? `<br>Phone: ${esc(o.phone)}` : ""}${o.order ? `<br>Order: ${esc(o.order)}` : ""}<br>Topic: ${esc(o.topic)}`) +
    `<div style="padding:14px 16px;background:${BRAND.bg};border-radius:10px">${esc(o.message).replace(/\n/g, "<br>")}</div>` +
    p(`<span style="color:${BRAND.muted};font-size:13px">Press Reply to answer ${esc(o.name)} directly.</span>`),
}));

/** A personal message written by the ManaBrand team in the admin panel. */
export const adminMessageEmail = (o: { name: string; subject: string; message: string; siteUrl: string }): Mail => mail(o.subject, layout({
  title: o.subject, preheader: o.message.slice(0, 90), siteUrl: o.siteUrl, reason: "You are receiving this message from the ManaBrand team.",
  body: p(`Hi ${esc(o.name.split(" ")[0])},`) + `<div style="margin:0 0 14px">${esc(o.message).replace(/\n/g, "<br>")}</div>` + p("Warm regards,<br>Team ManaBrand"),
}));

export const backInStockEmail = (o: { name: string; size?: string; slug: string; siteUrl: string }): Mail => mail(`Back in stock: ${o.name}`, layout({
  title: "Back in stock", preheader: `${o.name}${o.size ? ` (${o.size})` : ""} is available again.`, siteUrl: o.siteUrl,
  reason: "You asked us to email you when this came back in stock.",
  body: h("It’s back! 🎉") + p(`<b>${esc(o.name)}</b>${o.size ? ` in size <b>${esc(o.size)}</b>` : ""} is available again. Popular pieces go fast, so grab yours while it lasts.`) +
    button(`${o.siteUrl}/product/${o.slug}`, "Shop now"),
}));

export const abandonedCartEmail = (o: { name: string; items: { name: string; price: number }[]; siteUrl: string }): Mail => {
  const rows = o.items.slice(0, 4).map((i) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${BRAND.line}">${esc(i.name)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid ${BRAND.line};white-space:nowrap">${inr(i.price)}</td></tr>`).join("");
  return mail("You left something in your bag", layout({
    title: "Your bag is waiting", preheader: "Your picks are still in your bag.", siteUrl: o.siteUrl,
    reason: "You are receiving this because you have items in your ManaBrand bag. You can turn offers off in your account.",
    body: h("Still thinking it over?") + p(`Hi ${esc(o.name.split(" ")[0])}, you left these in your bag:`) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 12px">${rows}</table>` +
      (o.items.length > 4 ? p(`…and ${o.items.length - 4} more.`) : "") + p("Delivery within 48 hours, and cash on delivery is available.") + button(`${o.siteUrl}/cart`, "Return to your bag"),
  }));
};

/* -------------------------------------------------------------------- sellers */
export const sellerAppliedEmail = (o: { store: string; owner: string; siteUrl: string }): Mail => mail("We received your seller application", layout({
  title: "Seller application received", preheader: `${o.store} is waiting for review.`, siteUrl: o.siteUrl,
  reason: "You are receiving this because you applied to sell on ManaBrand.",
  body: h("Application received 🙌") + p(`Hi ${esc(o.owner.split(" ")[0])}, thanks for applying to sell <b>${esc(o.store)}</b> on ManaBrand. Our team reviews every application, usually within 2 working days.`) +
    p("You can sign in to your seller dashboard in the meantime — you will be able to add products as soon as you are approved.") + button(`${o.siteUrl}/seller/login`, "Open seller dashboard"),
}));
export const sellerAppliedAdminEmail = (o: { store: string; owner: string; city: string; siteUrl: string }): Mail => mail(`New seller application: ${o.store}`, layout({
  title: "New seller application", preheader: `${o.store} (${o.city})`, siteUrl: o.siteUrl,
  body: h("New seller application") + p(`<b>${esc(o.store)}</b> — ${esc(o.owner)}, ${esc(o.city)}`) + button(`${o.siteUrl}/admin/sellers`, "Review in admin"),
}));
export const sellerDecisionEmail = (o: { store: string; owner: string; status: "active" | "suspended" | "rejected"; siteUrl: string }): Mail => {
  const ok = o.status === "active";
  return mail(ok ? `${o.store} is approved on ManaBrand` : `Update on your ManaBrand store`, layout({
    title: ok ? "Store approved" : "Store update", preheader: ok ? "You can now list products." : "Please contact support for details.", siteUrl: o.siteUrl,
    reason: "You are receiving this because you are a ManaBrand seller.",
    body: ok ? h("Your store is approved 🎉") + p(`Hi ${esc(o.owner.split(" ")[0])}, <b>${esc(o.store)}</b> is now live on ManaBrand. You can start listing products.`) + button(`${o.siteUrl}/seller/products/new`, "Add your first product")
             : h("An update on your store") + p(`Hi ${esc(o.owner.split(" ")[0])}, your store <b>${esc(o.store)}</b> has been marked as <b>${esc(o.status)}</b>. Please write to us at ${SUPPORT.email} and we will explain.`),
  }));
};
