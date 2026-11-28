import Link from "next/link";
import { Clock, Mail, Phone, Sparkles } from "lucide-react";
import { InstagramIcon, YoutubeIcon } from "@/components/ui/brand-icons";
import { Logo } from "@/components/brand/logo";
import type { CmsNav, CmsSite } from "@/lib/cms/types";
import { InstallButton } from "./install-app";
import { NewsletterForm } from "./newsletter";

const heading = "mb-2 flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] sm:text-[11px] sm:tracking-[0.28em] text-white md:mb-3 md:gap-3 md:text-[12px] md:tracking-[0.35em]";

/**
 * Footer in the reference's style (the big call-to-action card sits above it, see cta-band.tsx): four columns
 * (brand · link columns · find us · join the journey). Link columns, contact details,
 * copyright and the offer line come from the CMS (Navigation + Site settings).
 */
export function Footer({ site, nav }: { site: CmsSite; nav: CmsNav }) {
  const social = [site.instagram && [InstagramIcon, "Instagram", site.instagram], site.youtube && [YoutubeIcon, "YouTube", site.youtube], [Mail, "Email", site.supportEmail ? `mailto:${site.supportEmail}` : "/contact"]].filter(Boolean) as [typeof Mail, string, string][];
  const email = site.supportEmail ?? "care@manabrand.co.in";

  return (
    <footer data-round data-theme="dark" className="bg-black text-white">
      <div className="container-page">
        {/* columns */}
        <div className="grid gap-5 py-5 md:gap-10 md:py-12 lg:grid-cols-[1.1fr_1.7fr_1fr_1.2fr] lg:gap-10">
          <div>
            <div className="flex items-center justify-between gap-4">
              <Logo invert size="md" />
              <div className="flex gap-2 lg:hidden">
                {social.map(([Icon, l, href]) => (
                  <a key={l} href={href} aria-label={l} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03]"><Icon className="size-5" /></a>
                ))}
              </div>
            </div>
            <p className="mt-3 hidden max-w-xs text-sm leading-relaxed text-white/60 md:block">{site.footerAbout}</p>
            <InstallButton className="mt-3 max-md:hidden" label="Install the app" />
            <Link href="/seller/register" className="mt-3 inline-flex items-center gap-3 text-base font-semibold text-accent hover:text-white max-md:hidden"><span aria-hidden className="h-px w-6 bg-accent" />Sell on ManaBrand</Link>
            <div className="mt-5 hidden flex-wrap gap-2.5 lg:flex">
              {social.map(([Icon, l, href]) => (
                <a key={l} href={href} aria-label={l} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-accent hover:text-accent"><Icon className="size-5" /></a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-x-3 sm:gap-x-5 sm:gap-y-8">
            {nav.footerColumns.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <h3 className={heading}><span aria-hidden className="hidden h-px w-5 bg-accent sm:block" />{c.title}</h3>
                <ul className="space-y-0.5 max-sm:[&>li:nth-child(n+5)]:hidden sm:space-y-1">{c.links.map((l) => <li key={l.href + l.label}><Link href={l.href} className="block py-1 text-[13px] leading-snug text-white/65 transition-colors hover:text-white sm:text-sm">{l.label}</Link></li>)}</ul>
              </nav>
            ))}
          </div>

          <div>
            <h3 className={heading}><span aria-hidden className="h-px w-5 bg-accent" />Find us</h3>
            <ul className="flex flex-col gap-2 text-sm max-md:flex-row max-md:flex-wrap max-md:gap-x-6 md:space-y-3">
              {site.supportPhone && <li className="flex items-center gap-3.5"><Phone className="size-5 shrink-0 text-accent" /><a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="font-semibold tracking-wide hover:text-accent">{site.supportPhone}</a></li>}
              <li className="flex items-center gap-3.5 max-md:hidden">
                <span className="grid size-5 place-items-center text-[#25D366]">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5" aria-hidden="true">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.21 8.21 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.06s.88 2.39 1 2.56c.12.17 1.73 2.64 4.19 3.7.59.25 1.04.41 1.4.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3" />
                  </svg>
                </span>
                <a href="https://wa.me/918317658309?text=Hi%20ManaBrand!%20I%20have%20an%20inquiry." target="_blank" rel="noopener noreferrer" className="font-semibold text-white/90 hover:text-[#25D366]">
                  WhatsApp Us
                </a>
              </li>
              <li className="flex items-center gap-3.5"><Mail className="size-5 shrink-0 text-accent" /><a href={`mailto:${email}`} className="break-all text-white/70 hover:text-accent">{email}</a></li>
              <li className="flex items-center gap-3.5 max-md:hidden"><Clock className="size-5 shrink-0 text-accent" /><span className="text-white/70">Mon–Sat · 9am–8pm</span></li>
            </ul>
          </div>

          <div>
            <h3 className={heading}><span aria-hidden className="h-px w-5 bg-accent" />Join the journey</h3>
            <NewsletterForm />
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
