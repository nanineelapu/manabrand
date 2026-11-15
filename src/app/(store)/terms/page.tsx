import { CmsPageView, cmsMetadata } from "@/components/store/cms-page";
import { getCmsPage } from "@/lib/cms";
import { InfoPage } from "@/components/store/info-page";

/** A page with this address in the CMS replaces the built-in text below. */
export async function generateMetadata() {
  const cms = await getCmsPage("terms");
  return cms ? cmsMetadata(cms) : { title: "Terms of use" };
}

export default async function TermsPage() {
  const cms = await getCmsPage("terms");
  if (cms) return <CmsPageView page={cms} />;
  return (
    <InfoPage title="Terms of use" intro="By using ManaBrand you agree to these terms. They’re written to be readable." updated="1 November 2026">
      <section><h2>Using ManaBrand</h2><p>You must be 18 or older, or use ManaBrand under a parent’s supervision. Keep your login secure — you’re responsible for activity on your account.</p></section>
      <section><h2>Orders & pricing</h2><p>All prices are in Indian rupees and include applicable taxes. We may cancel orders affected by pricing errors or stock issues and will refund you in full.</p></section>
      <section><h2>Sellers</h2><p>ManaBrand is a marketplace. Products are sold by independent sellers; ManaBrand handles payments and support on their behalf.</p></section>
      <section><h2>Liability</h2><p>To the extent permitted by law, ManaBrand’s liability is limited to the value of the order in question.</p></section>
    </InfoPage>
  );
}
