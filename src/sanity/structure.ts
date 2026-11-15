import { CogIcon } from "@sanity/icons/Cog";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { HomeIcon } from "@sanity/icons/Home";
import { MenuIcon } from "@sanity/icons/Menu";
import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list().title("ManaBrand site content").items([
    S.listItem().title("Home page").icon(HomeIcon).child(S.document().schemaType("homePage").documentId("homePage")),
    S.listItem().title("Navigation").icon(MenuIcon).child(S.document().schemaType("navigation").documentId("navigation")),
    S.listItem().title("Site settings").icon(CogIcon).child(S.document().schemaType("siteSettings").documentId("siteSettings")),
    S.divider(),
    S.documentTypeListItem("page").title("Pages").icon(DocumentTextIcon),
  ]);
