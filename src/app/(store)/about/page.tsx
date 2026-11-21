import { CmsPageView, cmsMetadata } from "@/components/store/cms-page";
import { getCmsPage } from "@/lib/cms";
import { InfoPage } from "@/components/store/info-page";
import { ProductImage } from "@/components/brand/product-image";
import { Button } from "@/components/ui/button";

/** A page with this address in the CMS replaces the built-in text below. */
export async function generateMetadata() {
  const cms = await getCmsPage("about");
  return cms ? cmsMetadata(cms) : { title: "Our story" };
}

const stats = [["1,200+", "verified sellers"], ["28", "states represented"], ["2 lakh+", "happy shoppers"], ["4.7★", "average rating"]];

export default async function AboutPage() {
  const cms = await getCmsPage("about");
  if (cms) return <CmsPageView page={cms} />;
  return (
    <InfoPage title="Our story" intro="ManaBrand takes its name from “mana” — heart, spirit, the thing you put into what you make. We built ManaBrand as a marketplace where verified sellers across India — from handloom studios to footwear and jewellery shops — can reach the people who love what they make."
      aside={<div className="aspect-[3/4] overflow-hidden rounded-[28px]"><ProductImage photo="saree" seed="about" /></div>}>
      <section>
        <h2>Why we started</h2>
        <p>Good products and trustworthy sellers are scattered across the country, but finding them online meant sifting through endless look-alike listings. We wanted one place with honest photos, honest specs and a real seller behind every item.</p>
      </section>
      <section>
        <h2>How it works</h2>
        <ul>
          <li>Every maker is KYC-verified and quality-reviewed before they sell.</li>
          <li>Makers set their own prices and keep the lion’s share of every sale.</li>
          <li>We handle payments and support, and your order is delivered within 48 hours, so you can shop without worry.</li>
        </ul>
      </section>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(([v, l]) => <div key={l} className="rounded-card border border-line bg-card p-4 shadow-card"><dt className="font-display text-3xl font-semibold !text-fg">{v}</dt><dd className="text-xs text-muted">{l}</dd></div>)}
      </dl>
      <div className="flex flex-col gap-3 sm:flex-row"><Button href="/shop" size="lg" className="rounded-full">Start shopping</Button><Button href="/seller/register" size="lg" variant="outline" className="rounded-full">Sell on ManaBrand</Button></div>
    </InfoPage>
  );
}
