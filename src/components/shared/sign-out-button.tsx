"use client";

import { signOutAction } from "@/lib/auth/actions";
import { useCart, useWishlist } from "@/lib/stores";

/** A real sign-out: ends the Supabase session on the server, then redirects to the right login. */
export function SignOutButton({ area = "store", className, children, label }: {
  area?: "store" | "admin" | "seller"; className?: string; children: React.ReactNode; label?: string;
}) {
  return (
    <form action={signOutAction.bind(null, area)} className="contents"
      onSubmit={() => { if (area === "store") { useCart.getState().clear(); useWishlist.setState({ ids: [] }); } }}>
      <button type="submit" className={className} aria-label={label}>{children}</button>
    </form>
  );
}
