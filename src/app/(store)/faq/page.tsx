import { CmsPageView, cmsMetadata } from "@/components/store/cms-page";
import { getCmsPage } from "@/lib/cms";
import { InfoPage } from "@/components/store/info-page";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

/** A page with this address in the CMS replaces the built-in text below. */
export async function generateMetadata() {
  const cms = await getCmsPage("faq");
  return cms ? cmsMetadata(cms) : { title: "FAQs" };
}

const groups = [
  { title: "Orders & delivery", qs: [
    ["How long does delivery take?", "Every order is delivered within 48 hours of being placed."],
    ["How much is shipping?", "Orders are delivered within 48 hours. Any delivery charge is shown at checkout before you pay."],
    ["Can I change my address after ordering?", "You can change the address until the order is packed. Open the order in My orders or contact support."],
  ]},
  { title: "Payments", qs: [
    ["Which payment methods do you accept?", "UPI, credit/debit cards, net banking and cash on delivery (₹40 handling fee)."],
    ["Is it safe to pay on ManaBrand?", "Yes. Payments are processed through PCI-DSS compliant gateways. We never store your full card details."],
  ]},
  { title: "Sizing & products", qs: [
    ["How do I find my size?", "Use the size guide on every product page. If you’re between sizes, we recommend sizing up."],
    ["Are the colours accurate?", "We photograph in natural light, but screens vary. Handloom items can show slight natural variations — that’s part of their character."],
  ]},
];

export default async function FaqPage() {
  const cms = await getCmsPage("faq");
  if (cms) return <CmsPageView page={cms} />;
  return (
    <InfoPage title="Help & FAQs" intro="Quick answers to the things people ask most. Can’t find yours? Our team replies within 24 hours."
      aside={<div className="rounded-card bg-ink p-6 text-white"><h2 className="font-display text-xl font-semibold !text-white">Still need help?</h2><p className="mt-1.5 text-sm !text-white/70">Chat with us Mon–Sat, 9am–8pm.</p><Button href="/contact" variant="accent" className="mt-4 rounded-full" full>Contact support</Button></div>}>
      {groups.map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          <Accordion className="mt-2">{g.qs.map(([q, a]) => <AccordionItem key={q} title={q}>{a}</AccordionItem>)}</Accordion>
        </section>
      ))}
    </InfoPage>
  );
}
