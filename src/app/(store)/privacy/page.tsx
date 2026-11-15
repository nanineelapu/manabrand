import { CmsPageView, cmsMetadata } from "@/components/store/cms-page";
import { getCmsPage } from "@/lib/cms";
import { InfoPage } from "@/components/store/info-page";

/** A page with this address in the CMS replaces the built-in text below. */
export async function generateMetadata() {
  const cms = await getCmsPage("privacy");
  return cms ? cmsMetadata(cms) : { title: "Privacy policy" };
}

export default async function PrivacyPage() {
  const cms = await getCmsPage("privacy");
  if (cms) return <CmsPageView page={cms} />;
  return (
    <InfoPage title="Privacy policy" intro="We collect only what we need to deliver your orders and improve ManaBrand — and we never sell your data." updated="1 November 2026">
      <section><h2>What we collect</h2><ul><li>Account details: name, email, mobile number.</li><li>Order details: addresses, items, payment status (never full card numbers).</li><li>Usage data: pages viewed and device information to improve the experience.</li></ul></section>
      <section><h2>How we use it</h2><p>To process and deliver orders, provide support, prevent fraud, and — if you opt in — send offers and new-drop alerts. You can opt out anytime from Profile → Notifications.</p></section>
      <section><h2>Sharing</h2><p>We share the minimum necessary with the maker fulfilling your order, our courier partners and payment processors. We do not sell personal data.</p></section>
      <section><h2>Your rights</h2><p>You can access, correct or delete your data by writing to privacy@manabrand.in. We respond within 15 days.</p></section>
    </InfoPage>
  );
}
