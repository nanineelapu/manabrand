"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./src/sanity/env";
import { SINGLETONS, schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

const single = new Set<string>(SINGLETONS);

export default defineConfig({
  name: "mana", title: "ManaBrand · Site content", basePath: "/studio",
  projectId: projectId || "unconfigured", dataset,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    // singletons can't be created again from the "+" menu
    templates: (templates) => templates.filter(({ schemaType }) => !single.has(schemaType)),
  },
  document: {
    // …and can't be deleted, unpublished or duplicated
    actions: (input, { schemaType }) => (single.has(schemaType) ? input.filter(({ action }) => action && !["unpublish", "delete", "duplicate"].includes(action)) : input),
  },
});
