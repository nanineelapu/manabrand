import { CmsPageView, cmsMetadata } from "@/components/store/cms-page";
import { getCmsPage } from "@/lib/cms";
import { InfoPage } from "@/components/store/info-page";

/** A page with this address in the CMS replaces the built-in text below. */
export async function generateMetadata() {
  const cms = await getCmsPage("shipping-returns");
  return cms ? cmsMetadata(cms) : { title: "Shipping & delivery" };
}

export default async function ShippingDeliveryPage() {
  const cms = await getCmsPage("shipping-returns");
  if (cms) return <CmsPageView page={cms} />;
  return (
    <InfoPage title="Shipping, delivery & returns" intro="Simple, fast and predictable — here’s how delivery and returns work on ManaBrand." updated="15 November 2026">
      <section><h2>Delivery within 48 hours</h2>
        <ul><li>Every order is delivered within 48 hours of being placed.</li><li>Any delivery charge is shown at checkout before you pay.</li><li>Cash on delivery is available.</li><li>You’ll get tracking updates by SMS, email and on your order page.</li></ul></section>
      <section><h2>Cancelling an order</h2><p>Changed your mind? You can cancel an order from My orders until it has been packed. Any payment you made is refunded to your original payment method.</p></section>
      <section><h2>Returns & exchanges</h2>
        <ul><li>Not happy? Return or exchange within <b>7 days of delivery</b>.</li><li>Items must be unworn and unwashed, with tags and packaging.</li><li>Open <b>My orders</b>, choose the order and tap <b>Request return</b>. We arrange the pickup.</li><li>Refunds go to your original payment method within 5–7 working days after we receive the item. For cash on delivery, we refund by UPI or bank transfer.</li><li>Items marked “final sale” and made-to-measure pieces can’t be returned.</li></ul></section>
      <section><h2>Damaged or wrong item?</h2><p>Contact us within 48 hours of delivery with a photo and we’ll sort it out — just message us from the Contact page.</p></section>
    </InfoPage>
  );
}
