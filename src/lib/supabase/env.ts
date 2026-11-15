/**
 * Without Supabase credentials the app runs in DEMO MODE (mock data, no login guard),
 * so the frontend keeps working before the project is connected.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("YOUR-PROJECT"));

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
