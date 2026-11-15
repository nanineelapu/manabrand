import { cache } from "react";
import { cmsFetch } from "@/sanity/lib/client";
import { HREF } from "@/sanity/href";
import type { Category } from "@/types";
import { DEFAULT_HOME, DEFAULT_NAV, DEFAULT_SITE } from "./defaults";
import type { CmsHome, CmsNav, CmsPage, CmsSite, HeaderItem } from "./types";

export { DEFAULT_HOME, DEFAULT_NAV, DEFAULT_SITE } from "./defaults";
export type * from "./types";

/** Editor-filled fields win; anything empty falls back to the built-in value (so a half-filled document never breaks the site). */
export function overlay<T extends object>(base: T, cms: Partial<Record<keyof T, unknown>> | null): T {
  if (!cms) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(cms)) {
    if (v === null || v === undefined || v === "" || k.startsWith("_")) continue;
    if (Array.isArray(v)) { if (v.length) out[k] = v; continue; }
    const b = out[k];
    out[k] = v && typeof v === "object" && b && typeof b === "object" && !Array.isArray(b) ? overlay(b as object, v as object) : v;
  }
  return out as T;
}

export const SITE_Q = `*[_id == "siteSettings"][0]{
  siteName, defaultTitle, titleTemplate, description, "ogImage": ogImage.asset->url,
  announcementEnabled, announcements[]{text, highlight, hideOnMobile},
  footerAbout, newsletterTitle, copyright, madeIn, supportPhone, supportEmail, instagram, youtube
}`;
export const NAV_Q = `*[_id == "navigation"][0]{
  accountLabel,
  headerLinks[]{label, "href": ${HREF}, accent, dropdownCategory, showOn},
  footerColumns[]{title, links[]{label, "href": ${HREF}}},
  mobileQuickLinks[]{label, "href": ${HREF}}
}`;
export const HOME_Q = `*[_id == "homePage"][0]{
  "slides": heroSlides[]{headline, headlineEmphasis, subtitle, subtitleShort, subtitleHighlight, category, "image": image.asset->url, "mobileImage": mobileImage.asset->url},
  primaryCta, secondaryCta, categoriesCardTitle, categoriesTitle, trendingTitle, newArrivalsTitle, sellersTitle, sellersSubtitle
}`;
export const PAGE_Q = `*[_type == "page" && slug.current == $slug][0]{
  title, "slug": slug.current, intro, updated, "sideImage": sideImage.asset->url,
  body[]{..., _type == "image" => {..., "url": asset->url}},
  stats, faqGroups, ctas, seoTitle, seoDescription
}`;

export const getSiteContent = cache(async (): Promise<CmsSite> => overlay(DEFAULT_SITE, await cmsFetch<Partial<CmsSite>>(SITE_Q, ["sanity:siteSettings"])));

export const getNavContent = cache(async (): Promise<CmsNav> => {
  const cms = await cmsFetch<Partial<CmsNav> & { headerLinks?: CmsNav["headerLinks"] }>(NAV_Q, ["sanity:navigation"]);
  return overlay(DEFAULT_NAV, cms as Partial<Record<keyof CmsNav, unknown>> | null);
});

export const getHomeContent = cache(async (): Promise<CmsHome> => overlay(DEFAULT_HOME, await cmsFetch<Partial<CmsHome>>(HOME_Q, ["sanity:homePage"])));

/** A page written in the CMS, or null (→ the caller falls back to the built-in page / 404). */
export const getCmsPage = cache(async (slug: string): Promise<CmsPage | null> => cmsFetch<CmsPage>(PAGE_Q, ["sanity:page"], { slug }));

/** Header menu: the editor's own list if they made one, otherwise the categories (with dropdowns) · Collections (phones) · Sale. */
export function resolveHeader(nav: CmsNav, categories: Category[], subs: Record<string, string[]>): HeaderItem[] {
  const drop = (slug?: string) => {
    const c = categories.find((x) => x.slug === slug);
    return c ? { slug: c.slug, name: c.name, photo: c.photo, subs: subs[c.slug] ?? [] } : undefined;
  };
  if (nav.headerLinks?.length) {
    return nav.headerLinks.map((l) => ({ label: l.label, href: l.href, accent: l.accent, showOn: l.showOn ?? "all", dropdown: drop(l.dropdownCategory) }));
  }
  const HIDDEN = new Set(["electronics", "beauty"]); // not shown in the automatic menu (still reachable from the home page + shop)
  return [
    ...categories.filter((c) => !HIDDEN.has(c.slug)).map((c): HeaderItem => ({ label: c.name, href: `/category/${c.slug}`, showOn: "all", dropdown: drop(c.slug) })),
    { label: "Collections", href: "/collections", showOn: "mobile" },
    { label: "Sale", href: "/sale", accent: true, showOn: "all" },
  ];
}

/** Page title for <title>: `%s` template → "Our story · ManaBrand". */
export const pageTitle = (site: CmsSite, title: string) => site.titleTemplate.replace("%s", title);
