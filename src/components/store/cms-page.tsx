import Image from "next/image";
import type { Metadata } from "next";
import { PortableText, type PortableTextComponents } from "next-sanity";
import { InfoPage } from "@/components/store/info-page";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { CmsPage } from "@/lib/cms/types";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3 className="mb-1 mt-4 font-display text-lg font-semibold">{children}</h3>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-1.5 pl-5 text-muted">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-1.5 pl-5 text-muted">{children}</ol>,
  },
  marks: {
    link: ({ children, value }) => {
      const href = String(value?.href ?? "#");
      return <a href={href} className="font-medium text-accent underline underline-offset-2" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>;
    },
  },
  types: {
    image: ({ value }: { value: { url?: string; alt?: string } }) => (value?.url
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={`${value.url}?w=1200&auto=format`} alt={value.alt ?? ""} loading="lazy" className="w-full border border-line" />
      : null),
  },
};

/** Metadata for a CMS page: its own SEO title/description (falls back to the page title / intro). */
export const cmsMetadata = (p: CmsPage): Metadata => ({ title: p.seoTitle || p.title, description: p.seoDescription || p.intro });

/** Renders a page written in Sanity inside the same layout as the built-in info pages. */
export function CmsPageView({ page: p }: { page: CmsPage }) {
  const updated = p.updated ? new Date(p.updated).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : undefined;
  return (
    <InfoPage title={p.title} intro={p.intro} updated={updated}
      aside={p.sideImage ? <div className="relative aspect-[3/4] overflow-hidden"><Image src={`${p.sideImage}?w=900&auto=format`} alt="" fill sizes="320px" unoptimized className="object-cover" /></div> : undefined}>
      {p.body?.length ? <PortableText value={p.body} components={components} /> : null}
      {p.stats?.length ? (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {p.stats.map((s) => <div key={s.label} className="border border-line bg-card p-4 shadow-card"><dt className="font-display text-3xl font-semibold !text-fg">{s.value}</dt><dd className="text-xs text-muted">{s.label}</dd></div>)}
        </dl>
      ) : null}
      {p.faqGroups?.map((g, i) => (
        <section key={g.title ?? i}>
          {g.title && <h2>{g.title}</h2>}
          <Accordion className="mt-2">{g.items.map((q) => <AccordionItem key={q.question} title={q.question}>{q.answer}</AccordionItem>)}</Accordion>
        </section>
      ))}
      {p.ctas?.length ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          {p.ctas.map((c, i) => <Button key={c.href + c.label} href={c.href} size="lg" variant={i === 0 ? "primary" : "outline"}>{c.label}</Button>)}
        </div>
      ) : null}
    </InfoPage>
  );
}
