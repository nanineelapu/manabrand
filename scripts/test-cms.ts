/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Checks the CMS layer without a Sanity project:
 *  - every GROQ query parses and returns the shape the site expects, run against a sample dataset (same engine Sanity uses)
 *  - half-filled documents never break the site (editor values win, empty ones fall back to built-ins)
 *  - the header menu resolves correctly with and without an editor-made menu
 * Run: npm run cms:test
 */
import { evaluate, parse } from "groq-js";
import { DEFAULT_HOME, DEFAULT_NAV, DEFAULT_SITE, HOME_Q, NAV_Q, PAGE_Q, SITE_Q, overlay, resolveHeader } from "../src/lib/cms";

let pass = 0, fail = 0;
const ok = (name: string, cond: unknown, extra?: unknown) => { if (cond) { pass++; console.log("PASS ", name); } else { fail++; console.log("FAIL ", name, extra ?? ""); } };
const q = async (query: string, dataset: unknown[], params = {}) => { const value = await evaluate(parse(query, { params }), { dataset, params }); return (await value.get()) as any; };

const dataset = [
  { _id: "siteSettings", _type: "siteSettings", defaultTitle: "Mana — Everything", titleTemplate: "%s | Mana", description: "", announcementEnabled: true,
    announcements: [{ _key: "a", text: "Diwali sale — 20% off", highlight: "20% off" }], supportEmail: "care@mana.in", ogImage: { asset: { _ref: "image-1" } } },
  { _id: "p-about", _type: "page", title: "Our story", slug: { current: "about" }, intro: "Hi", body: [{ _type: "block", style: "h2", children: [{ _type: "span", text: "Why" }] }], faqGroups: [{ title: "G", items: [{ question: "Q?", answer: "A" }] }] },
  { _id: "p-gift", _type: "page", title: "Gift cards", slug: { current: "gift-cards" } },
  { _id: "navigation", _type: "navigation", accountLabel: "My Mana",
    headerLinks: [
      { _key: "1", label: "Gifts", kind: "page", page: { _ref: "p-gift" } },
      { _key: "2", label: "Phones", kind: "custom", url: "/category/electronics", dropdownCategory: "electronics", accent: true },
    ],
    footerColumns: [{ _key: "c", title: "Help", links: [{ _key: "l", label: "About", kind: "page", page: { _ref: "p-about" } }, { _key: "m", label: "Blog", kind: "custom", url: "https://blog.mana.in" }] }] },
  { _id: "homePage", _type: "homePage", heroSlides: [{ _key: "s1", headline: "Big sale\nthis week", subtitle: "Up to 40% off", category: "fashion", image: { asset: { _ref: "image-1" } } }, { _key: "s2", headline: "New tech", subtitle: "Gadgets" }], primaryCta: { label: "Go", href: "/sale" } },
];

(async () => {
  const site = await q(SITE_Q, dataset);
  ok("site query returns settings", site.defaultTitle === "Mana — Everything" && site.announcements[0].highlight === "20% off");
  const mergedSite = overlay(DEFAULT_SITE, site);
  ok("site: editor value wins", mergedSite.defaultTitle === "Mana — Everything" && mergedSite.titleTemplate === "%s | Mana");
  ok("site: empty description falls back to built-in", mergedSite.description === DEFAULT_SITE.description);
  ok("site: untouched fields keep built-in copy", mergedSite.footerAbout === DEFAULT_SITE.footerAbout && mergedSite.copyright === DEFAULT_SITE.copyright);

  const nav = await q(NAV_Q, dataset);
  ok("nav: page link resolves to /slug", nav.headerLinks[0].href === "/gift-cards", nav.headerLinks);
  ok("nav: custom link keeps its path", nav.headerLinks[1].href === "/category/electronics");
  ok("nav: footer links resolve (page + external)", nav.footerColumns[0].links[0].href === "/about" && nav.footerColumns[0].links[1].href === "https://blog.mana.in");
  const mergedNav = overlay(DEFAULT_NAV, nav);
  ok("nav: footer replaced by editor's columns", mergedNav.footerColumns.length === 1 && mergedNav.accountLabel === "My Mana");
  ok("nav: quick links fall back to built-ins", mergedNav.mobileQuickLinks.length === DEFAULT_NAV.mobileQuickLinks.length);

  const home = await q(HOME_Q, dataset);
  const mergedHome = overlay(DEFAULT_HOME, home);
  ok("home: editor slides replace the built-in ones", mergedHome.slides.length === 2 && mergedHome.slides[0].headline.includes("this week") && mergedHome.slides[0].category === "fashion");
  ok("home: fixed CTA from editor", mergedHome.primaryCta.href === "/sale");
  ok("home: no slides in CMS → built-in carousel", overlay(DEFAULT_HOME, null).slides.length === DEFAULT_HOME.slides.length && DEFAULT_HOME.slides.length >= 3);
  ok("home: partially-filled CTA keeps built-in sibling fields", mergedHome.secondaryCta.label === DEFAULT_HOME.secondaryCta.label);
  ok("home: untouched sections keep built-in titles", mergedHome.trendingTitle === DEFAULT_HOME.trendingTitle);

  const page = await q(PAGE_Q, dataset, { slug: "about" });
  ok("page query by slug", page?.title === "Our story" && page.slug === "about" && page.faqGroups[0].items[0].question === "Q?");
  ok("unknown slug → null (site falls back / 404)", (await q(PAGE_Q, dataset, { slug: "nope" })) === null);

  // header menu
  const cats = [{ slug: "fashion", name: "Fashion", photo: "fashion" }, { slug: "electronics", name: "Electronics", photo: "tech" }] as any;
  const subs = { fashion: ["Women"], electronics: ["Phones", "Audio"] };
  const auto = resolveHeader(DEFAULT_NAV, cats, subs);
  ok("auto menu: categories (no New / Electronics / Beauty) · Collections(mobile) · Sale", auto.map((i) => i.label).join("|") === "Fashion|Collections|Sale" && auto[0].dropdown?.subs[0] === "Women" && auto.find((i) => i.label === "Collections")?.showOn === "mobile");
  const custom = resolveHeader(mergedNav, cats, subs);
  ok("editor menu replaces the auto one", custom.length === 2 && custom[0].href === "/gift-cards");
  ok("editor menu: dropdown pulls the category's sub-categories", custom[1].dropdown?.subs.join() === "Phones,Audio" && custom[1].accent === true);
  ok("editor menu: unknown category slug → no dropdown, no crash", resolveHeader({ ...DEFAULT_NAV, headerLinks: [{ label: "X", href: "/x", dropdownCategory: "ghost" }] }, cats, subs)[0].dropdown === undefined);
  ok("no Sanity data at all → exact built-in content", JSON.stringify(overlay(DEFAULT_SITE, null)) === JSON.stringify(DEFAULT_SITE));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
