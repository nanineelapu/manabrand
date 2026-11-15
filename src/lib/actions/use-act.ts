"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "@/lib/stores";

type R = { ok: boolean; error?: string; demo?: boolean };

/**
 * Runs a server action from the UI.
 *  - success → optional toast, `onOk(result)`, then router.refresh() so server data is re-read
 *  - demo mode (no Supabase) → runs `onDemo` (default: `onOk`) so the screen still behaves locally
 *  - failure → red toast with the server's message
 */
export function useAct() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const act = useCallback(async <T extends R>(
    fn: () => Promise<T>,
    opts: { success?: string; onOk?: (r: T) => void; onDemo?: (r: T) => void; refresh?: boolean; silentError?: boolean } = {},
  ): Promise<T | null> => {
    setBusy(true);
    try {
      const r = await fn();
      if (r.ok) {
        if (opts.success) toast.success(opts.success);
        opts.onOk?.(r);
        if (opts.refresh !== false) router.refresh();
      } else if (r.demo) {
        if (opts.success) toast.success(`${opts.success} (demo)`);
        (opts.onDemo ?? opts.onOk)?.(r);
      } else if (!opts.silentError) {
        toast.error(r.error ?? "Something went wrong");
      }
      return r;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }, [router]);

  return { act, busy };
}
