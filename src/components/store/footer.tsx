import Link from "next/link";
import { Clock, Mail, Phone, Sparkles } from "lucide-react";
import { InstagramIcon, YoutubeIcon } from "@/components/ui/brand-icons";
import { Logo } from "@/components/brand/logo";
import type { CmsNav, CmsSite } from "@/lib/cms/types";
import { NewsletterForm } from "./newsletter";

const heading = "mb-2 flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] sm:text-[11px] sm:tracking-[0.28em] text-white md:mb-3 md:gap-3 md:text-[12px] md:tracking-[0.35em]";

/**
 * Footer in the reference's style (the big call-to-action card sits above it, see cta-band.tsx): four columns
 * (brand · link columns · find us · join the journey). Link columns, contact details,
 * copyright and the offer line come from the CMS (Navigation + Site settings).
 */
export function Footer({ site, nav }: { site: CmsSite; nav: CmsNav }) {
  const social = [site.instagram && [InstagramIcon, "Instagram", site.instagram], site.youtube && [YoutubeIcon, "YouTube", site.youtube], [Mail, "Email", site.supportEmail ? `mailto:${site.supportEmail}` : "/contact"]].filter(Boolean) as [typeof Mail, string, string][];
  const email = site.supportEmail ?? "care@manabrand.in";

  return (
    <footer data-round data-theme="dark" className="bg-black text-white">
      <div className="container-page">
        {/* columns */}
        <div className="grid gap-6 py-6 md:gap-10 md:py-12 lg:grid-cols-[1.1fr_1.7fr_1fr_1.2fr] lg:gap-10">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Logo invert size="md" />
              <div className="flex gap-2 lg:hidden">
                {social.map(([Icon, l, href]) => (
                  <a key={l} href={href} aria-label={l} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03]"><Icon className="size-5" /></a>
                ))}
              </div>
            </div>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/60 md:mt-3 md:text-sm">{site.footerAbout}</p>
            <Link href="/seller/register" className="mt-3 inline-flex items-center gap-3 text-base font-semibold text-accent hover:text-white"><span aria-hidden className="h-px w-6 bg-accent" />Sell on ManaBrand</Link>
            <div className="mt-5 hidden gap-2.5 lg:flex">
              {social.map(([Icon, l, href]) => (
                <a key={l} href={href} aria-label={l} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-accent hover:text-accent"><Icon className="size-5" /></a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-x-3 sm:gap-x-5 sm:gap-y-8">
            {nav.footerColumns.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <h3 className={heading}><span aria-hidden className="hidden h-px w-5 bg-accent sm:block" />{c.title}</h3>
                <ul className="space-y-1">{c.links.map((l) => <li key={l.href + l.label}><Link href={l.href} className="block py-1 text-[13px] leading-snug text-white/65 transition-colors hover:text-white sm:text-sm">{l.label}</Link></li>)}</ul>
              </nav>
            ))}
          </div>

          <div>
            <h3 className={heading}><span aria-hidden className="h-px w-5 bg-accent" />Find us</h3>
            <ul className="space-y-2.5 text-sm md:space-y-3">
              {site.supportPhone && <li className="flex items-center gap-3.5"><Phone className="size-5 shrink-0 text-accent" /><a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="font-semibold tracking-wide hover:text-accent">{site.supportPhone}</a></li>}
              <li className="flex items-center gap-3.5"><Mail className="size-5 shrink-0 text-accent" /><a href={`mailto:${email}`} className="break-all text-white/70 hover:text-accent">{email}</a></li>
              <li className="flex items-center gap-3.5"><Clock className="size-5 shrink-0 text-accent" /><span className="text-white/70">Mon–Sat · 9am–8pm</span></li>
            </ul>
          </div>

          <div>
            <h3 className={heading}><span aria-hidden className="h-px w-5 bg-accent" />Join the journey</h3>
            <NewsletterForm />
            <p className="mt-2 text-xs italic text-white/50 md:hidden">{site.newsletterTitle}.</p>
            <div className="mt-3 hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:mt-4 md:block">
              <p className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.25em] text-accent"><Sparkles className="size-4" />Welcome offer</p>
              <p className="mt-2.5 text-sm italic leading-relaxed text-white/55">{site.newsletterTitle}. Join the list and we’ll send it straight to your inbox.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-white/10 py-3 text-[11px] text-white/45 md:py-4 md:text-xs md:flex-row md:items-center md:justify-between">
          <p>{site.copyright}</p>
          {site.madeIn && <p className="font-semibold uppercase tracking-[0.2em]">{site.madeIn}</p>}
        </div>
      </div>
      <div className="h-[var(--tabbar-h)] lg:hidden" aria-hidden />
    </footer>
  );
}
