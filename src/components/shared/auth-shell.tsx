import Link from "next/link";
import { ArrowLeft, BadgeCheck, BarChart3, Boxes, Clock, ShieldCheck, Truck, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Toaster } from "@/components/ui/toaster";

type Item = { icon: typeof Truck; text: string };
const variants: Record<"customer" | "seller" | "admin", { photo: string; lead: string; hot: string; items: Item[]; quote: string; by: string; back?: { href: string; label: string } }> = {
  customer: {
    photo: "1572804013309-59a88b7e92f1", lead: "Everything you love,", hot: "one login.",
    items: [{ icon: Truck, text: "Free shipping above ₹1,499" }, { icon: Clock, text: "Delivery within 48 hours" }, { icon: BadgeCheck, text: "Verified sellers across India" }],
    quote: "“Arrived within two days, exactly as shown. Delivery was super quick.”", by: "A ManaBrand shopper, Ichapuram", back: { href: "/", label: "Back to store" },
  },
  seller: {
    photo: "1618220179428-22790b461013", lead: "Sell to all of India,", hot: "from one place.",
    items: [{ icon: Boxes, text: "List products and manage stock" }, { icon: BarChart3, text: "Track orders and sales live" }, { icon: Wallet, text: "Clear, simple payouts" }],
    quote: "“I went from Instagram DMs to 400 orders a month in one season.”", by: "A local ManaBrand seller", back: { href: "/", label: "Back to store" },
  },
  admin: {
    photo: "1517336714731-489689fd1ca8", lead: "Run the marketplace,", hot: "every order.",
    items: [{ icon: ShieldCheck, text: "Staff-only access" }, { icon: BarChart3, text: "Sales, sellers and payouts" }, { icon: Boxes, text: "Products, stock and content" }],
    quote: "Every order, seller and rupee — in one place.", by: "ManaBrand operations console",
  },
};

/**
 * Sign-in / register layout. Desktop: a black brand panel (photo, headline, benefits) beside a clean form.
 * Phones: a short photo header, with the form sliding up over it as a rounded sheet.
 * The shell is marked data-round so inputs and buttons get soft corners inside it (the rest of the site stays square).
 */
export function AuthShell({
  variant = "customer", title, subtitle, children, footer,
}: { variant?: keyof typeof variants; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const v = variants[variant];
  const photo = (w: number) => `https://images.unsplash.com/photo-${v.photo}?auto=format&fit=crop&crop=entropy&w=${w}&h=${Math.round(w * 1.25)}&q=70`;
  const logoVariant = variant === "customer" ? "store" : variant;

  return (
    <div data-surface={variant === "customer" ? "store" : variant} data-round style={{ "--r-ctl": "14px", "--r-card": "22px" } as React.CSSProperties}
      className="min-h-dvh bg-bg text-fg lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- desktop brand panel ---------- */}
      <aside data-theme="dark" className="relative hidden overflow-hidden bg-black text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:p-12 xl:p-14">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo(1400)} alt="" className="absolute inset-0 -z-20 size-full object-cover" fetchPriority="high" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/60" />
        <div aria-hidden className="absolute -bottom-40 -left-32 -z-10 size-[34rem] rounded-full bg-primary/40 blur-[110px]" />

        <Logo variant={logoVariant} invert size="lg" />

        <div className="max-w-lg">
          <h2 className="text-[clamp(34px,3.1vw,48px)] font-black leading-[1.08] tracking-[-0.04em] text-white">
            {v.lead}<br /><span className="text-[var(--red-mid)]">{v.hot}</span>
          </h2>
          <ul className="mt-8 space-y-3.5">
            {v.items.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5 text-[15px] text-white/90">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md"><Icon className="size-[18px]" /></span>{text}
              </li>
            ))}
          </ul>
        </div>

        <figure className="max-w-md rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
          <blockquote className="text-[15px] leading-relaxed text-white/95">{v.quote}</blockquote>
          <figcaption className="mt-2.5 text-sm text-white/65">{v.by}</figcaption>
        </figure>
      </aside>

      {/* ---------- form side ---------- */}
      <main className="relative flex min-h-dvh flex-col bg-bg lg:min-h-0 lg:justify-center">
        {/* phone header: photo + logo */}
        <div data-theme="dark" className="relative h-44 shrink-0 overflow-hidden bg-black lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo(900)} alt="" className="absolute inset-0 size-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-black/55" />
          <div className="relative flex items-start justify-between p-5">
            <Logo variant={logoVariant} invert size="md" />
            {v.back && <Link href={v.back.href} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 text-[13px] font-semibold text-white backdrop-blur-md"><ArrowLeft className="size-3.5" />Store</Link>}
          </div>
        </div>

        {v.back && (
          <Link href={v.back.href} className="absolute right-10 top-8 hidden items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-fg lg:inline-flex">
            <ArrowLeft className="size-4" />{v.back.label}
          </Link>
        )}

        <div className="relative -mt-8 flex-1 rounded-t-[32px] bg-bg px-5 pb-10 pt-8 sm:px-10 lg:mt-0 lg:flex-none lg:rounded-none lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-[420px]">
            <h1 className="text-[32px] font-black leading-[1.05] tracking-[-0.04em] md:text-[40px]">{title}</h1>
            {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">{footer}</div>}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
