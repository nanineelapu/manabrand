import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineArrayMember, defineField, defineType } from "sanity";
import { RESERVED_SLUGS } from "./shared";

export const page = defineType({
  name: "page", title: "Pages", type: "document", icon: DocumentTextIcon,
  groups: [{ name: "content", title: "Content", default: true }, { name: "extras", title: "FAQ, numbers & buttons" }, { name: "seo", title: "SEO" }],
  fields: [
    defineField({ name: "title", title: "Page title", type: "string", group: "content", validation: (r) => r.required() }),
    defineField({
      name: "slug", title: "Address (URL)", type: "slug", group: "content", options: { source: "title", maxLength: 60 },
      description: "The page lives at /your-slug. Slugs like about, faq, privacy, terms and shipping-returns replace the built-in pages of the same name.",
      validation: (r) => r.required().custom((v) => (v?.current && RESERVED_SLUGS.includes(v.current) ? `“${v.current}” is used by the shop itself — pick another` : true)),
    }),
    defineField({ name: "intro", title: "Intro paragraph", type: "text", rows: 3, group: "content" }),
    defineField({ name: "updated", title: "Last updated", type: "date", group: "content", description: "Shown under the title (useful for policies)." }),
    defineField({
      name: "body", title: "Page content", type: "array", group: "content",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Paragraph", value: "normal" }, { title: "Section heading", value: "h2" }, { title: "Sub-heading", value: "h3" }],
          lists: [{ title: "Bullets", value: "bullet" }, { title: "Numbers", value: "number" }],
          marks: {
            decorators: [{ title: "Bold", value: "strong" }, { title: "Italic", value: "em" }],
            annotations: [{ name: "link", type: "object", title: "Link", fields: [defineField({ name: "href", type: "string", title: "Address", validation: (r) => r.required() })] }],
          },
        }),
        defineArrayMember({ type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", type: "string", title: "Describe the photo" })] }),
      ],
    }),
    defineField({ name: "sideImage", title: "Side photo", type: "image", options: { hotspot: true }, group: "extras", description: "Optional tall photo shown beside the content on large screens." }),
    defineField({
      name: "stats", title: "Number highlights", type: "array", group: "extras",
      of: [defineArrayMember({ type: "object", name: "stat", fields: [defineField({ name: "value", type: "string", title: "Number", validation: (r) => r.required() }), defineField({ name: "label", type: "string", title: "Label", validation: (r) => r.required() })], preview: { select: { title: "value", subtitle: "label" } } })],
    }),
    defineField({
      name: "faqGroups", title: "FAQ groups", type: "array", group: "extras", description: "Turns the page into an expandable question list.",
      of: [defineArrayMember({
        type: "object", name: "faqGroup",
        fields: [
          defineField({ name: "title", type: "string", title: "Group title" }),
          defineField({
            name: "items", type: "array", title: "Questions",
            of: [defineArrayMember({ type: "object", name: "faqItem", fields: [defineField({ name: "question", type: "string", validation: (r) => r.required() }), defineField({ name: "answer", type: "text", rows: 3, validation: (r) => r.required() })], preview: { select: { title: "question" } } })],
          }),
        ],
        preview: { select: { title: "title", items: "items" }, prepare: ({ title, items }) => ({ title, subtitle: `${items?.length ?? 0} questions` }) },
      })],
    }),
    defineField({
      name: "ctas", title: "Buttons at the end", type: "array", group: "extras", validation: (r) => r.max(2),
      of: [defineArrayMember({ type: "object", name: "cta", fields: [defineField({ name: "label", type: "string", validation: (r) => r.required() }), defineField({ name: "href", type: "string", validation: (r) => r.required() })], preview: { select: { title: "label", subtitle: "href" } } })],
    }),
    defineField({ name: "seoTitle", title: "Browser / Google title", type: "string", group: "seo", description: "Defaults to the page title." }),
    defineField({ name: "seoDescription", title: "Google description", type: "text", rows: 2, group: "seo", validation: (r) => r.max(200).warning("Keep it under about 160 characters") }),
  ],
  preview: { select: { title: "title", slug: "slug.current" }, prepare: ({ title, slug }) => ({ title, subtitle: slug ? `/${slug}` : "no address yet" }) },
});
