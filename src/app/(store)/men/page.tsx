import { GroupPage } from "@/components/store/group-page";

export const metadata = { title: "Men's Fashion" };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <GroupPage group="men" searchParams={searchParams} />;
}
