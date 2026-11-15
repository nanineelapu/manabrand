"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SESSION_COOKIE_OPTIONS } from "./cookies";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;
/** Browser client — used ONLY for file uploads straight to Storage (protected by the storage policies). */
export function browserClient() {
  if (!client) client = createBrowserClient(supabaseUrl, supabaseAnonKey, { cookieOptions: SESSION_COOKIE_OPTIONS });
  return client;
}

const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Use a JPG, PNG or WebP image.";
  if (file.size > MAX_BYTES) return "Images must be under 5 MB.";
  return null;
}

/** Uploads to a public bucket and returns the public URL. `path` MUST start with the seller's id folder. */
export async function uploadPublicImage(bucket: "product-images" | "seller-assets" | "banners", path: string, file: File): Promise<string> {
  if (!isSupabaseConfigured()) throw new Error("Storage is not connected.");
  const bad = validateImage(file); if (bad) throw new Error(bad);
  const supabase = browserClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Private KYC upload (PDF or image, up to 10 MB). Returns the storage path to record. */
export async function uploadKyc(path: string, file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) throw new Error("Use a PDF, JPG or PNG.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Files must be under 10 MB.");
  const { error } = await browserClient().storage.from("seller-kyc").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export const fileExt = (f: File) => (f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : f.type === "application/pdf" ? "pdf" : "jpg");
