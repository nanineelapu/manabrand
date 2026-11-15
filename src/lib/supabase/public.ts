import { createClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Cookie-less client for PUBLIC catalogue reads (products, categories, banners…).
 * Safe to call at build time / from generateStaticParams. RLS limits it to what anonymous visitors may see.
 */
export function createPublicClient() {
  return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
