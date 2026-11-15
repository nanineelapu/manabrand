import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";
import { isSanityConfigured } from "@/sanity/env";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

/** The content editor, embedded at /studio. Sanity handles its own sign-in (Google / GitHub / email) and permissions. */
export default function StudioPage() {
  if (!isSanityConfigured()) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-3xl font-semibold">Content editor not connected yet</h1>
        <p className="mt-3 text-muted">Add <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> to <code>.env.local</code> and restart the dev server. Step-by-step: <code>docs/SANITY_SETUP.md</code>.</p>
        <p className="mt-3 text-muted">Until then the site shows its built-in content, so nothing is broken.</p>
      </main>
    );
  }
  return <div data-studio><NextStudio config={config} /></div>;
}
