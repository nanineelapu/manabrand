"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { subscribeNewsletter } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";

/** Footer sign-up: dark rounded field with a red arrow button (the heading lives in the footer column). */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const { act } = useAct();
  return (
    <form noValidate onSubmit={(e) => {
      e.preventDefault();
      if (!/^\S+@\S+\.\S+$/.test(email)) { setErr("Enter a valid email address"); return; }
      setErr(""); act(() => subscribeNewsletter(email), { success: "You’re on the list — welcome to ManaBrand!", onOk: () => setEmail(""), refresh: false });
    }}>
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 pl-4 transition-colors focus-within:border-accent">
        <input id="nl-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email"
          aria-invalid={!!err} aria-describedby={err ? "nl-err" : undefined}
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40" />
        <button type="submit" aria-label="Subscribe to the newsletter" className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover">
          <ArrowUp className="size-5" />
        </button>
      </div>
      {err && <p id="nl-err" role="alert" className="mt-2 pl-1 text-xs text-danger">{err}</p>}
    </form>
  );
}
