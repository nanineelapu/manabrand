/**
 * Clears the saved site-content documents in Sanity so the site falls back to the built-in Ichapuram content
 * (src/lib/cms/defaults.ts). Use it once after the content was localised, then edit again in /studio if you like.
 *
 *   npm run sanity:reset            → shows what would be deleted (nothing changes)
 *   npm run sanity:reset -- --yes   → deletes Home page, Navigation and Site settings (drafts too)
 *
 * Needs NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN (sanity.io/manage → API → Tokens → "Editor") in .env.local.
 * Info pages (About, FAQ…) are NOT touched. Edits you made in the Studio to the three documents above are lost.
 */
import { createClient } from "@sanity/client";

const IDS = ["homePage", "navigation", "siteSettings"];

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) { console.log("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN in .env.local first."); return 1; }
  const client = createClient({ projectId, dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production", apiVersion: "2025-02-19", token, useCdn: false });
  const ids = IDS.flatMap((id) => [id, `drafts.${id}`]);
  const found = await client.fetch<{ _id: string; _type: string }[]>(`*[_id in $ids]{_id, _type}`, { ids });
  if (!found.length) { console.log("Nothing to delete — the site already uses the built-in content."); return 0; }
  found.forEach((d) => console.log(`${process.argv.includes("--yes") ? "deleting" : "would delete"}  ${d._id}  (${d._type})`));
  if (!process.argv.includes("--yes")) { console.log("\nRun again with --yes to delete."); return 0; }
  const tx = client.transaction(); found.forEach((d) => tx.delete(d._id)); await tx.commit();
  console.log("\nDone. Reload the site — it now shows the built-in content.");
  return 0;
}
main().then((c) => process.exit(c), (e) => { console.error(e.message); process.exit(1); });
