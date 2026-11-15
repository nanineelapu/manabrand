import type { CmsSite } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

function Message({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) return <>{text}</>;
  const [a, ...rest] = text.split(highlight);
  return <>{a}<b className="font-extrabold underline underline-offset-2">{highlight}</b>{rest.join(highlight)}</>;
}

/** White strip with black text, shown at the bottom of the home hero — text is edited in the CMS (Site settings → Announcement bar). */
export function AnnouncementBar({ site }: { site: Pick<CmsSite, "announcementEnabled" | "announcements"> }) {
  if (!site.announcementEnabled || !site.announcements.length) return null;
  return (
    <div className="bg-white px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-black sm:text-xs">
      {site.announcements.map((m, i) => (
        <span key={i} className={cn((i > 0 || m.hideOnMobile) && "hidden sm:inline")}>
          {i > 0 && <span className={cn("mx-2.5 hidden text-black/40 sm:inline")}>·</span>}
          <Message text={m.text} highlight={m.highlight} />
        </span>
      ))}
    </div>
  );
}
