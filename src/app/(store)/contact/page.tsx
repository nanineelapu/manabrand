import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/store/contact-form";
import { InfoPage } from "@/components/store/info-page";

export const metadata = { title: "Contact us" };

const channels = [
  { icon: Phone, t: "Call & WhatsApp", d: "+91 831 765 8309" },
  { icon: Mail, t: "Email", d: "care@manabrand.in" },
  { icon: Clock, t: "Hours", d: "Mon–Sat, 9am – 8pm IST" },
  { icon: MapPin, t: "Find us", d: "Ichapuram, Srikakulam district, Andhra Pradesh 532312" },
];

export default function ContactPage() {
  return (
    <InfoPage title="Contact us" intro="Questions about an order or a product? We’re real people and we’re happy to help."
      aside={<ul className="space-y-3">{channels.map(({ icon: I, t, d }) => <li key={t} className="flex items-start gap-3.5 rounded-card border border-line bg-card p-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I className="size-5" /></span><span><span className="block text-sm font-semibold">{t}</span><span className="text-[13px] text-muted">{d}</span></span></li>)}</ul>}>
      <ContactForm />
    </InfoPage>
  );
}
