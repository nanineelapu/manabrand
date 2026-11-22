import { createClient } from "next-sanity";
import { apiVersion, dataset, isSanityConfigured, projectId } from "../env";

const client = createClient({
  projectId: projectId || "unconfigured",
  dataset, apiVersion,
  useCdn: false,                            // webhook revalidation needs fresh reads, not CDN-cached ones
  token: process.env.SANITY_API_READ_TOKEN?.trim(), // only needed if the dataset is private
});

/** Cached read. Tagged so the /api/revalidate webhook can refresh exactly what changed. Never throws: returns null on any failure. */
export async function cmsFetch<T>(query: string, tags: string[], params: Record<string, unknown> = {}): Promise<T | null> {
  if (!isSanityConfigured()) return null;
  try {
    return await client.fetch<T>(query, params, { next: { revalidate: 120, tags } });
  } catch (e) {
    console.error("[sanity] fetch failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
