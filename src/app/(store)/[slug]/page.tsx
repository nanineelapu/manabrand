import { notFound } from "next/navigation";
import { CmsPageView, cmsMetadata } from "@/components/store/cms-page";
import { getCmsPage } from "@/lib/cms";

/**
 * Any page an editor creates in the CMS (Pages → New) is served here at /<its-address>.
 * Real routes in the app (/shop, /cart, /about …) always win over this one.
 */
export async function generateMetadata({ params }: PageProps<"/[slug]">) {
  const page = await getCmsPage((await params).slug);
  return page ? cmsMetadata(page) : { title: "Page not found" };
}

export default async function CmsRoute({ params }: PageProps<"/[slug]">) {
  const page = await getCmsPage((await params).slug);
  if (!page) notFound();
  return <CmsPageView page={page} />;
}
