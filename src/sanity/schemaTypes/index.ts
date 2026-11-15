import { homePage } from "./homePage";
import { navigation } from "./navigation";
import { page } from "./page";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [siteSettings, navigation, homePage, page];
/** Documents that exist exactly once (fixed _id), so editors can't create duplicates or delete them. */
export const SINGLETONS = ["siteSettings", "navigation", "homePage"] as const;
