import { defineField } from "sanity";

/** Slugs that belong to the app itself — a CMS page can't take these (the app's own route would win anyway). */
export const RESERVED_SLUGS = [
  "shop", "cart", "checkout", "account", "wishlist", "search", "sale", "new", "collections", "category", "product", "sellers",
  "order-confirmed", "track-order", "login", "register", "forgot-password", "reset-pin", "admin", "seller", "studio", "api", "auth", "contact", "size-guide",
];

/** Reusable "where does this link go?" fields: pick a CMS page, or type any path / URL. */
export const linkFields = [
  defineField({ name: "kind", title: "Links to", type: "string", initialValue: "page", options: { list: [{ title: "A page from the CMS", value: "page" }, { title: "Any path or web address", value: "custom" }], layout: "radio" } }),
  defineField({
    name: "page", title: "Page", type: "reference", to: [{ type: "page" }],
    hidden: ({ parent }) => parent?.kind === "custom",
    validation: (r) => r.custom((v, ctx) => ((ctx.parent as { kind?: string })?.kind !== "custom" && !v ? "Choose a page" : true)),
  }),
  defineField({
    name: "url", title: "Path or address", type: "string", description: "Examples: /shop, /men, /sale, https://example.com",
    hidden: ({ parent }) => parent?.kind !== "custom",
    validation: (r) => r.custom((v, ctx) => {
      if ((ctx.parent as { kind?: string })?.kind !== "custom") return true;
      return typeof v === "string" && /^(\/|https?:\/\/|mailto:|tel:)/.test(v) ? true : "Start with / (a page on this site) or https://";
    }),
  }),
];

export { HREF } from "../href";
