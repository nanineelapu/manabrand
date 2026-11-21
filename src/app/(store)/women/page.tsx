import { GroupPage } from "@/components/store/group-page";

export const metadata = { title: "Women's Fashion" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <GroupPage group="women" searchParams={searchParams} />;
}
