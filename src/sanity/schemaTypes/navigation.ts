import { MenuIcon } from "@sanity/icons/Menu";
import { defineArrayMember, defineField, defineType } from "sanity";
import { linkFields } from "./shared";

const label = defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required().max(28) });
const linkPreview = {
  select: { title: "label", kind: "kind", slug: "page.slug.current", url: "url" },
  prepare: ({ title, kind, slug, url }: { title?: string; kind?: string; slug?: string; url?: string }) => ({ title, subtitle: kind === "custom" ? url : slug ? `/${slug}` : "" }),
};

export const navigation = defineType({
  name: "navigation", title: "Navigation", type: "document", icon: MenuIcon,
  groups: [{ name: "header", title: "Header menu", default: true }, { name: "footer", title: "Footer links" }, { name: "mobile", title: "Phone menu extras" }],
  fields: [
    defineField({
      name: "headerLinks", title: "Header menu", type: "array", group: "header",
      description: "Leave empty to use the automatic menu (New · every category · Sale). Add items here to take full control of the order, names and links.",
      of: [defineArrayMember({
        type: "object", name: "headerLink", title: "Menu item",
        fields: [
          label, ...linkFields,
          defineField({ name: "dropdownCategory", title: "Show a category dropdown", type: "string", description: "Category slug (fashion or accessories). The dropdown lists that category's sub-categories automatically." }),
          defineField({ name: "accent", title: "Highlight in gold", type: "boolean", initialValue: false }),
          defineField({ name: "showOn", title: "Show on", type: "string", initialValue: "all", options: { list: [{ title: "Everywhere", value: "all" }, { title: "Desktop only", value: "desktop" }, { title: "Phones only", value: "mobile" }] } }),
        ],
        preview: linkPreview,
      })],
    }),
    defineField({ name: "accountLabel", title: "Account button text", type: "string", group: "header", initialValue: "Account" }),

    defineField({
      name: "footerColumns", title: "Footer columns", type: "array", group: "footer", validation: (r) => r.max(4),
      of: [defineArrayMember({
        type: "object", name: "footerColumn",
        fields: [
          defineField({ name: "title", title: "Column title", type: "string", validation: (r) => r.required() }),
          defineField({ name: "links", title: "Links", type: "array", of: [defineArrayMember({ type: "object", name: "footerLink", fields: [label, ...linkFields], preview: linkPreview })] }),
        ],
        preview: { select: { title: "title", links: "links" }, prepare: ({ title, links }) => ({ title, subtitle: `${links?.length ?? 0} links` }) },
      })],
    }),

    defineField({
      name: "mobileQuickLinks", title: "Quick links at the bottom of the phone menu", type: "array", group: "mobile",
      of: [defineArrayMember({ type: "object", name: "quickLink", fields: [label, ...linkFields], preview: linkPreview })],
    }),
  ],
  preview: { prepare: () => ({ title: "Navigation" }) },
});
