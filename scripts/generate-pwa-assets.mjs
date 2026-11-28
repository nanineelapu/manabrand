/**
 * Builds the installed-app (PWA) images so the app's launch screen looks like the website's preloader:
 * a black screen with the white-lettered ManaBrand logo, dimmed, with the thin progress track under it.
 *   - public/pwa/icon-192.png, icon-512.png   black background, logo (Android splash screen + home icon)
 *   - public/pwa/maskable-512.png             same, with the safe-zone padding adaptive icons need
 *   - public/pwa/apple-touch-icon.png         iOS home-screen icon (iOS turns transparency black, hiding the black lettering)
 *   - public/pwa/splash/<w>x<h>.png           iOS launch images (one per screen size)
 * Run again whenever the logo changes:   node scripts/generate-pwa-assets.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const LOGO = "public/logo-dark.png";   // 819x1024, white "Mana", red hand + BRAND, transparent
const OUT = "public/pwa";
mkdirSync(`${OUT}/splash`, { recursive: true });

const logoBuf = (h, opacity = 1) =>
  sharp(LOGO).resize({ height: Math.round(h) }).ensureAlpha()
    .linear(opacity === 1 ? [1, 1, 1, 1] : [1, 1, 1, opacity], [0, 0, 0, 0]).png().toBuffer();

/** A square icon: black background, logo filling `fill` of the height. */
async function icon(size, fill, file) {
  const logo = await logoBuf(size * fill);
  await sharp({ create: { width: size, height: size, channels: 4, background: "#000000" } })
    .composite([{ input: logo, gravity: "center" }]).png().toFile(`${OUT}/${file}`);
}

await icon(192, 0.8, "icon-192.png");
await icon(512, 0.8, "icon-512.png");
await icon(512, 0.56, "maskable-512.png");     // maskable: everything inside the central 80% circle
await icon(180, 0.78, "apple-touch-icon.png");

/** iOS launch image: same layout as the preloader at 0% — dim logo, empty track — so the animation continues from it. */
const SCREENS = [   // [css width, css height, pixel ratio]
  [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2], [320, 568, 2],
  [834, 1194, 2], [820, 1180, 2], [1024, 1366, 2], [810, 1080, 2],
];
for (const [w, h, r] of SCREENS) {
  const W = w * r, H = h * r;
  const logoH = (w >= 700 ? 240 : 160) * r;                 // preloader: h-40 on phones, md:h-60 on tablets
  const logo = await logoBuf(logoH, 0.2);
  const m = await sharp(logo).metadata();
  const stageH = logoH + 28 * r + 3 * r;                    // logo + gap + track
  const top = Math.round(H / 2 - stageH / 2 - 0.04 * H);   // preloader stage is centred and nudged up 4vh
  const trackW = Math.round(Math.min(260, w * 0.62) * r), trackH = 3 * r;
  const track = Buffer.from(`<svg width="${trackW}" height="${trackH}" xmlns="http://www.w3.org/2000/svg"><rect width="${trackW}" height="${trackH}" rx="${trackH / 2}" fill="#ffffff" fill-opacity="0.12"/></svg>`);
  await sharp({ create: { width: W, height: H, channels: 4, background: "#000000" } })
    .composite([
      { input: logo, left: Math.round((W - m.width) / 2), top },
      { input: track, left: Math.round((W - trackW) / 2), top: top + logoH + 28 * r },
    ]).png({ compressionLevel: 9 }).toFile(`${OUT}/splash/${W}x${H}.png`);
}
console.log("PWA images written to", OUT);
