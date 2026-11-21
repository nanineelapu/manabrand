/** WhatsApp click-to-chat links (wa.me). No API or account needed — they open WhatsApp with the message ready to send. */
export const SUPPORT_WHATSAPP = "918317658309";

/** Strip a phone number to digits and add India's +91 when it is a 10-digit number. */
const digits = (phone: string) => { const d = phone.replace(/\D/g, ""); return d.length === 10 ? `91${d}` : d; };

export const waLink = (phone: string, text: string) => `https://wa.me/${digits(phone)}?text=${encodeURIComponent(text)}`;

/** Customer → ManaBrand: "I have a question about my order". */
export const askAboutOrder = (number: string) => waLink(SUPPORT_WHATSAPP, `Hi ManaBrand! I have a question about my order ${number}.`);

const STATUS_TEXT: Record<string, string> = {
  placed: "has been placed", confirmed: "is confirmed", packed: "is packed and ready", shipped: "is on its way",
  out_for_delivery: "is out for delivery today", delivered: "has been delivered", cancelled: "was cancelled",
};
/** ManaBrand → customer: a status message the team can send from the admin order page. */
export const orderUpdateLink = (o: { phone: string; name: string; number: string; status: string; awb?: string; courier?: string }) =>
  waLink(o.phone, `Hi ${o.name.split(" ")[0]}, your ManaBrand order ${o.number} ${STATUS_TEXT[o.status] ?? `is ${o.status}`}.${o.awb ? ` Tracking no.: ${o.awb}.` : ""} Thank you for shopping local! – Team ManaBrand`);
