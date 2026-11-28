import { GroupPage } from "@/components/store/group-page";
import { groupMeta, pageMeta } from "@/lib/seo";

export const metadata = pageMeta(groupMeta("women"));

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <GroupPage group="women" searchParams={searchParams} />;
}
