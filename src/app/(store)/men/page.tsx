import { GroupPage } from "@/components/store/group-page";
import { groupMeta, pageMeta } from "@/lib/seo";

export const metadata = pageMeta(groupMeta("men"));

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <GroupPage group="men" searchParams={searchParams} />;
}
