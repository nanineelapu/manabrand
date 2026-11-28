"use client";

import { Suspense, useState, useSyncExternalStore } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Gift, Sparkles, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { WELCOME_CREDIT } from "@/lib/wallet";

interface WelcomeWalletData {
  name?: string;
  amount?: number;
  next?: string;
}

export function WelcomeWalletPopup(props: {
  forceOpen?: boolean;
  initialData?: WelcomeWalletData;
  onDismiss?: () => void;
}) {
  return (
    <Suspense fallback={null}>
      <WelcomeWalletPopupInner {...props} />
    </Suspense>
  );
}

function subscribeStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("mana_welcome_wallet_updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("mana_welcome_wallet_updated", callback);
  };
}

function getStoredWalletSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem("mana_welcome_wallet");
  } catch {
    return null;
  }
}

function getServerStoredWalletSnapshot(): string | null {
  return null;
}

function WelcomeWalletPopupInner({
  forceOpen,
  initialData,
  onDismiss,
}: {
  forceOpen?: boolean;
  initialData?: WelcomeWalletData;
  onDismiss?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dismissed, setDismissed] = useState(false);

  const rawStorage = useSyncExternalStore(
    subscribeStorage,
    getStoredWalletSnapshot,
    getServerStoredWalletSnapshot
  );

  const storedData: WelcomeWalletData | null = rawStorage
    ? (() => {
        try {
          return JSON.parse(rawStorage);
        } catch {
          return null;
        }
      })()
    : null;

  const hasParam = searchParams.get("welcome_wallet") === "1" || searchParams.get("new_account") === "1";
  const open = !dismissed && (Boolean(forceOpen) || hasParam || Boolean(storedData));
  const data: WelcomeWalletData = initialData || storedData || {};

  const cleanUrl = () => {
    try {
      sessionStorage.removeItem("mana_welcome_wallet");
      sessionStorage.setItem("mana_welcome_wallet_seen", "true");
    } catch {
      // Ignore
    }

    if (typeof window !== "undefined" && (searchParams.has("welcome_wallet") || searchParams.has("new_account"))) {
      const params = new URLSearchParams(window.location.search);
      params.delete("welcome_wallet");
      params.delete("new_account");
      const qs = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState(null, "", `${window.location.pathname}${qs}`);
    }
  };

  const close = () => {
    setDismissed(true);
    cleanUrl();
    onDismiss?.();
  };

  const followRoute = (destination?: string) => {
    close();
    const target = destination || data.next;
    if (target && target !== pathname) {
      router.push(target);
    }
  };

  if (!open) return null;

  const nextRoute = data.next || "";
  const isCheckout = /checkout/i.test(nextRoute) || /checkout/i.test(pathname);
  const isCart = /cart/i.test(nextRoute) || /cart/i.test(pathname);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-wallet-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Dimmed backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={close}
        aria-hidden="true"
      />

      {/* Celebration Modal Panel */}
      <div className=" relative z-10 w-full max-w-md overflow-hidden rounded-[32px] border border-black/10 bg-white p-6 text-neutral-900 shadow-[0_24px_64px_rgba(0,0,0,0.22)] sm:p-8">
        {/* Soft Pink Background Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-primary/10 blur-3xl"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={close}
          aria-label="Close welcome banner"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X className="size-5" />
        </button>

        {/* Top Celebration Badge */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
            <Sparkles className="size-3.5" /> Welcome Bonus Gift
          </span>

          {/* Central Glowing Wallet Icon */}
          <div className="relative mx-auto my-4 grid size-20 place-items-center rounded-full bg-gradient-to-tr from-[#e0247a] to-[#ff6ea7] text-white shadow-[0_10px_28px_rgba(224,36,122,0.38)]">
            <Wallet className="size-10" />
            <span className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-[#1f8a5f] px-2 py-0.5 text-[11px] font-black tracking-wide text-white shadow-md">
              <Gift className="size-3" /> +{formatINR(WELCOME_CREDIT)}
            </span>
          </div>

          <h2
            id="welcome-wallet-title"
            className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-[28px]"
          >
            Yay! You got {formatINR(WELCOME_CREDIT)} in your wallet 🎉
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Welcome to ManaBrand{data.name ? `, ${data.name}` : ""}! Your {formatINR(WELCOME_CREDIT)} signup gift has been credited to your wallet and is ready to use.
          </p>
        </div>

        {/* Wallet Balance & Benefit Card */}
        <div className="mt-5 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Current Wallet Balance
            </span>
            <span className="font-mono text-xl font-black text-accent tabular">
              {formatINR(data.amount || WELCOME_CREDIT)}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-neutral-200/70 pt-3 text-[12.5px] leading-snug text-neutral-700">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-success/20 text-[10px] font-bold text-success">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
              <span>
                Applied <b>automatically at checkout</b> on items worth ₹999 or more — ₹200 to ₹350 off per order.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                ★
              </span>
              <span>
                Save <b>₹200 to ₹350</b> instantly depending on your order total!
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons with Follow-up Routing */}
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            size="lg"
            className="w-full rounded-full bg-primary font-bold text-white shadow-md hover:bg-primary-hover"
            onClick={() => followRoute(nextRoute || (isCheckout ? "/checkout" : isCart ? "/cart" : "/shop"))}
          >
            {isCheckout
              ? "Continue to checkout"
              : isCart
              ? "Go to your bag"
              : "Start shopping"}
            <ArrowRight className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full rounded-full font-semibold text-neutral-700 hover:bg-neutral-100"
            onClick={() => followRoute("/account/wallet")}
          >
            <Wallet className="size-4 text-accent" />
            View wallet details
          </Button>
        </div>
      </div>
    </div>
  );
}
