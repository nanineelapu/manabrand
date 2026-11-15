import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Brute-force protection backed by the `login_attempts` table (service-role only).
 * A 6-digit PIN has 1,000,000 combinations, so this is a core part of PIN security:
 * 5 wrong tries in 15 minutes locks that account's sign-in for the rest of the window.
 */
export const MAX_FAILURES = 5;
export const WINDOW_MINUTES = 15;

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export async function lockoutStatus(identifier: string, max = MAX_FAILURES, windowMin = WINDOW_MINUTES) {
  const since = new Date(Date.now() - windowMin * 60_000).toISOString();
  const { data } = await createAdminClient()
    .from("login_attempts").select("created_at").eq("identifier", identifier).eq("success", false)
    .gte("created_at", since).order("created_at", { ascending: true });
  const failures = data?.length ?? 0;
  if (failures < max) return { locked: false as const, failures, minutesLeft: 0 };
  const oldestCounting = new Date(data![failures - max].created_at).getTime();
  const minutesLeft = Math.max(1, Math.ceil((oldestCounting + windowMin * 60_000 - Date.now()) / 60_000));
  return { locked: true as const, failures, minutesLeft };
}

export async function recordAttempt(identifier: string, success: boolean) {
  await createAdminClient().from("login_attempts").insert({ identifier, success, ip: await clientIp() });
}

export async function clearFailures(identifier: string) {
  await createAdminClient().from("login_attempts").delete().eq("identifier", identifier).eq("success", false);
}
