import { SettingsView } from "@/components/admin/settings-view";
import { PageHeader } from "@/components/shared/blocks";
import { getSettings } from "@/lib/data";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Store, payments, shipping, commission and team" />
      <SettingsView initial={await getSettings()} />
    </>
  );
}
