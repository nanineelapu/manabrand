import { CogIcon } from "@sanity/icons/Cog";
import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings", title: "Site settings", type: "document", icon: CogIcon,
  groups: [{ name: "seo", title: "Titles & SEO", default: true }, { name: "announce", title: "Announcement bar" }, { name: "footer", title: "Footer & contact" }],
  fields: [
    defineField({ name: "siteName", title: "Site name", type: "string", group: "seo", initialValue: "ManaBrand" }),
    defineField({ name: "defaultTitle", title: "Home page title", type: "string", group: "seo", description: "Shown in the browser tab and Google on the home page." }),
    defineField({ name: "titleTemplate", title: "Title for other pages", type: "string", group: "seo", initialValue: "%s · ManaBrand", description: "%s is replaced by each page's own title." }),
    defineField({ name: "description", title: "Site description", type: "text", rows: 3, group: "seo", validation: (r) => r.max(200).warning("Google shows about 160 characters") }),
    defineField({ name: "ogImage", title: "Social sharing image", type: "image", group: "seo", description: "Shown when the link is shared on WhatsApp, Facebook, X…" }),

    defineField({ name: "announcementEnabled", title: "Show the announcement bar", type: "boolean", group: "announce", initialValue: true }),
    defineField({
      name: "announcements", title: "Messages", type: "array", group: "announce", description: "Shown side by side in the black bar above the header.",
      of: [{
        type: "object", name: "announcement",
        fields: [
          defineField({ name: "text", title: "Text", type: "string", validation: (r) => r.required().max(90) }),
          defineField({ name: "highlight", title: "Highlighted words", type: "string", description: "Optional — must appear in the text above; shown in gold and bold (e.g. a coupon code)." }),
          defineField({ name: "hideOnMobile", title: "Hide on phones", type: "boolean", initialValue: false }),
        ],
        preview: { select: { title: "text" } },
      }],
    }),

    defineField({ name: "footerAbout", title: "Footer description", type: "text", rows: 3, group: "footer", description: "Keep it local — e.g. a local fashion marketplace for Ichapuram, Srikakulam and the villages around it." }),
    defineField({ name: "newsletterTitle", title: "Newsletter heading", type: "string", group: "footer" }),
    defineField({ name: "copyright", title: "Copyright line", type: "string", group: "footer", initialValue: "© 2026 ManaBrand Pvt. Ltd. All rights reserved." }),
    defineField({ name: "madeIn", title: "Small print", type: "string", group: "footer", initialValue: "Made in Ichapuram" }),
    defineField({ name: "supportPhone", title: "Support phone", type: "string", group: "footer", description: "Shown in the footer and contact page, e.g. +91 831 765 8309." }),
    defineField({ name: "supportEmail", title: "Support email", type: "string", group: "footer", validation: (r) => r.email() }),
    defineField({ name: "instagram", title: "Instagram link", type: "url", group: "footer" }),
    defineField({ name: "youtube", title: "YouTube link", type: "url", group: "footer" }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
