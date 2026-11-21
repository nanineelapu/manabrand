import { HomeIcon } from "@sanity/icons/Home";
import { defineArrayMember, defineField, defineType } from "sanity";

const cta = (name: string, title: string) => defineField({
  name, title, type: "object", group: "hero",
  fields: [
    defineField({ name: "label", title: "Button text", type: "string" }),
    defineField({ name: "href", title: "Goes to", type: "string", description: "e.g. /shop or /collections", validation: (r) => r.custom((v) => (!v || /^(\/|https?:\/\/)/.test(String(v)) ? true : "Start with / or https://")) }),
  ],
});

export const homePage = defineType({
  name: "homePage", title: "Home page", type: "document", icon: HomeIcon,
  groups: [{ name: "hero", title: "Hero", default: true }, { name: "sections", title: "Section titles" }],
  fields: [
    defineField({
      name: "heroSlides", title: "Hero slides", type: "array", group: "hero",
      description: "Each slide is one full hero. Add as many as you like — visitors see them as a carousel (it slides by itself, and has arrows + dots). The two buttons below stay fixed on top of every slide.",
      of: [defineArrayMember({
        type: "object", name: "heroSlide", title: "Slide",
        fields: [
          defineField({ name: "headline", title: "Headline", type: "text", rows: 2, validation: (r) => r.required(), description: "Press Enter for a new line." }),
          defineField({ name: "headlineEmphasis", title: "Special word in the headline", type: "string", description: "Optional — one word from the headline, shown on a red highlight." }),
          defineField({ name: "subtitle", title: "Sub-headline", type: "text", rows: 3, validation: (r) => r.required() }),
          defineField({ name: "subtitleShort", title: "Shorter sub-headline for phones", type: "string", description: "Optional — one short line shown on phones instead of the full sub-headline.", validation: (r) => r.max(90) }),
          defineField({ name: "subtitleHighlight", title: "Highlighted phrase in the sub-headline", type: "string", description: "Optional — words from the sub-headline shown bold and underlined." }),
          defineField({ name: "category", title: "Category", type: "string", description: "Optional — category slug (men or women). Used for the small label and to pick a matching stock photo when you don't upload one." }),
          defineField({ name: "mobileImage", title: "Phone photo (portrait)", type: "image", options: { hotspot: true }, description: "Optional — a tall photo (e.g. 1080×1920) shown on phones instead of the main photo." }),
          defineField({ name: "image", title: "Slide photo", type: "image", options: { hotspot: true }, description: "The big full-width photo for this slide (landscape, about 2400×1400). Leave empty to use a stock photo that matches the category." }),
        ],
        preview: { select: { title: "headline", subtitle: "category" }, prepare: ({ title, subtitle }) => ({ title: String(title ?? "").replace(/\n/g, " "), subtitle: subtitle ? `Products: ${subtitle}` : "Products: trending" }) },
      })],
    }),
    cta("primaryCta", "Fixed button 1 (red)"),
    cta("secondaryCta", "Fixed button 2 (outlined)"),

    defineField({ name: "categoriesCardTitle", title: "“Popular categories” heading", type: "string", group: "sections" }),
    defineField({ name: "categoriesTitle", title: "Small line above that heading", type: "string", group: "sections" }),
    defineField({ name: "trendingTitle", title: "“Trending” heading", type: "string", group: "sections" }),
    defineField({ name: "newArrivalsTitle", title: "“New arrivals” heading", type: "string", group: "sections" }),
    defineField({ name: "sellersTitle", title: "“Top sellers” heading", type: "string", group: "sections" }),
    defineField({ name: "sellersSubtitle", title: "“Top sellers” sub-heading", type: "string", group: "sections" }),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
});
