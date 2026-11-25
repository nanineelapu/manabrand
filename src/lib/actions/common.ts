import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Every action answers with this shape. `demo: true` means "no database connected" — the UI then keeps its local behaviour. */
export type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string; demo?: boolean };

export const demoResult = (): Result => ({ ok: false, error: "Demo mode — connect Supabase to save changes.", demo: true });
export const live = () => isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

/** Turn Postgres / PostgREST errors into something a person can read. */
export function friendly(message: string): string {
  if (/Not enough stock for/i.test(message)) return `Sorry — ${message.replace(/^.*Not enough stock for\s*/i, "").trim() || "an item"} just sold out or has fewer pieces left than in your bag. Please update your bag and try again.`;
  if (/no longer available/i.test(message)) return "An item in your bag is no longer available. Please remove it and try again.";
  if (/row-level security|permission denied|not allowed/i.test(message)) return "You don’t have permission to do that.";
  if (/duplicate key|unique/i.test(message)) return "That already exists.";
  if (/foreign key/i.test(message)) return "This is in use elsewhere and can’t be removed.";
  if (/violates check constraint/i.test(message)) return "Some of the values aren’t valid. Please check and try again.";
  if (/JWT|not signed in|session/i.test(message)) return "Please sign in again.";
  if (/schema cache/i.test(message)) return "We couldn’t process your order right now. Please try again in a moment.";
  return message;
}
export const fail = (e: unknown): Result => ({ ok: false, error: friendly(e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)) });

export interface Actor { id: string; role: "customer" | "seller" | "admin" | null; email: string | null }

export async function currentActor(): Promise<Actor | null> {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null;
  return { id: user.id, role: (user.app_metadata?.role as Actor["role"]) ?? null, email: user.email ?? null };
}

/** Run an action body with a signed-in actor of an allowed role; centralises auth + error mapping. */
export async function guarded<T extends object = object>(
  roles: Array<NonNullable<Actor["role"]>>,
  // the body's result shape is checked against each action's declared return type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (actor: Actor) => Promise<any>,
): Promise<Result<T>> {
  if (!live()) return demoResult() as Result<T>;
  try {
    const actor = await currentActor();
    if (!actor) return { ok: false, error: "Please sign in to continue." };
    if (!actor.role || !roles.includes(actor.role)) return { ok: false, error: "You don’t have permission to do that." };
    return await fn(actor);
  } catch (e) {
    return fail(e) as Result<T>;
  }
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
export const isUuid = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export const clampStr = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);
