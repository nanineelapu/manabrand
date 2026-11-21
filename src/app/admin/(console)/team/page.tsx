import { TeamManager } from "@/components/admin/team-manager";
import { PageHeader } from "@/components/shared/blocks";
import { getSessionProfile } from "@/lib/auth/session";
import { getTeam } from "@/lib/data/team";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const [members, me] = await Promise.all([getTeam(), getSessionProfile()]);
  return (
    <>
      <PageHeader title="Team" subtitle="People who can sign in to this admin panel." />
      <TeamManager members={members} meId={(me as { id?: string } | null)?.id} />
    </>
  );
}
