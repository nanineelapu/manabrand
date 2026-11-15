import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";
import { Panel, PageHeader } from "@/components/shared/blocks";
import { Button } from "@/components/ui/button";
import { isSanityConfigured } from "@/sanity/env";

export const metadata = { title: "Site content" };

const inCms = [
  ["Navigation", "Header menu items, their order, names and links · footer columns & links · phone-menu quick links"],
  ["Home page", "Headline, sub-headline, buttons, hero photo, customer quote, section headings"],
  ["Titles & SEO", "Site name, browser-tab titles, Google description, social-share image"],
  ["Announcement bar", "The black strip above the header — messages, highlighted coupon text, on/off"],
  ["Footer & contact", "Footer text, copyright, support phone & email, Instagram / YouTube links"],
  ["Pages", "About, FAQs, Privacy, Terms, Shipping & returns — or brand-new pages that get their own address"],
];
const inAdmin = [
  ["Products, stock & prices", "/admin/products"], ["Categories & sub-categories", "/admin/categories"], ["Homepage banners", "/admin/banners"],
  ["Coupons", "/admin/coupons"], ["Orders, returns, payouts, sellers, customers", "/admin/orders"],
];

export default function ContentPage() {
  const connected = isSanityConfigured();
  return (
    <>
      <PageHeader title="Site content" subtitle="Edit the website’s menus, text and pages without touching code"
        actions={connected ? <Button href="/studio" target="_blank" rel="noopener"><ExternalLink className="size-4" /> Open content editor</Button> : undefined} />

      <div className={`mb-5 flex items-start gap-3 border p-4 text-sm ${connected ? "border-success/30 bg-success-bg text-success" : "border-warning/30 bg-warning-bg"}`}>
        {connected ? <CheckCircle2 className="mt-0.5 size-5 shrink-0" /> : <CircleAlert className="mt-0.5 size-5 shrink-0" />}
        <p>{connected
          ? <>Connected to Sanity. Changes you publish in the editor appear on the site within moments.</>
          : <>The content editor isn’t connected yet — the site is showing its built-in content. Follow <b>docs/SANITY_SETUP.md</b> (about 10 minutes) to switch it on.</>}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Edited in the content editor (Sanity)">
          <ul className="divide-y divide-line">{inCms.map(([t, d]) => <li key={t} className="py-3"><p className="text-sm font-medium">{t}</p><p className="text-xs text-muted">{d}</p></li>)}</ul>
        </Panel>
        <Panel title="Still managed here in Admin">
          <ul className="divide-y divide-line">{inAdmin.map(([t, h]) => <li key={t} className="py-3"><a href={h} className="text-sm font-medium text-accent hover:underline">{t} →</a></li>)}</ul>
          <p className="mt-3 text-xs text-muted">Shop data lives in the database because it changes with every order and needs security rules — the CMS is only for words, menus and pages.</p>
        </Panel>
      </div>
    </>
  );
}
