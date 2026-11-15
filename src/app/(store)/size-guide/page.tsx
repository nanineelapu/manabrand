import { InfoPage } from "@/components/store/info-page";
import { SizeChart } from "@/components/store/size-chart";

export const metadata = { title: "Size guide" };

export default function SizeGuidePage() {
  return (
    <InfoPage title="Size guide" intro="Find your fit in under a minute. All measurements are body measurements in inches.">
      <section><h2>Apparel</h2><SizeChart className="mt-3" /></section>
      <section>
        <h2>How to measure</h2>
        <ul>
          <li><b className="text-fg">Bust:</b> around the fullest part of your chest, keeping the tape level.</li>
          <li><b className="text-fg">Waist:</b> around the narrowest part of your torso, usually just above the navel.</li>
          <li><b className="text-fg">Hip:</b> around the fullest part of your hips, about 8 inches below the waist.</li>
        </ul>
      </section>
      <section><h2>Between sizes?</h2><p>Cottons relax after the first wash, so size down if you like a close fit. For structured pieces like jackets and blouses, size up for room to layer.</p></section>
    </InfoPage>
  );
}
