"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Check, MessageSquare, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/status";
import { Avatar, EmptyState, Rating } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { moderateReview, replyToReview } from "@/lib/actions/manage";
import { useAct } from "@/lib/actions/use-act";
import { Textarea } from "@/components/ui/form";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/types";

type R = Review & { productName: string };

export function ReviewsModeration({ reviews, canModerate = true }: { reviews: R[]; canModerate?: boolean }) {
  const [list, setList] = useState(reviews);
  const { act } = useAct();
  const [tab, setTab] = useState(canModerate ? "pending" : "all");
  const rows = useMemo(() => list.filter((r) => tab === "all" || r.status === tab), [list, tab]);
  const n = (s: string) => list.filter((r) => s === "all" || r.status === s).length;

  return (
    <>
      <Tabs variant="pill" size="sm" className="mb-4" value={tab} onChange={setTab} items={[
        ...(canModerate ? [{ value: "pending", label: "Pending", count: n("pending") }, { value: "flagged", label: "Flagged", count: n("flagged") }] : []),
        { value: "published", label: "Published", count: n("published") }, { value: "all", label: "All", count: n("all") },
      ]} />
      {rows.length === 0 ? <div className="rounded-card border border-dashed border-line-strong bg-card"><EmptyState icon={<MessageSquare />} title="Nothing to review" body="You’re all caught up." /></div> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-card border border-line bg-card p-4 shadow-card md:p-5">
              <div className="flex items-start gap-3">
                <Avatar name={r.author} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-sm font-semibold">{r.author}</p><span className="text-xs text-muted">{r.city} · {formatDate(r.date)}</span>{r.verified && <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><BadgeCheck className="size-3.5" />Verified buyer</span>}</div>
                  <p className="mt-0.5 truncate text-xs text-muted">on {r.productName}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <Rating value={r.rating} showValue={false} className="mt-3" />
              <p className="mt-1.5 text-sm font-semibold">{r.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{r.body}</p>
              {canModerate ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3.5">
                  {r.status !== "published" && <Button size="sm" onClick={() => act(() => moderateReview(r.id, "publish"), { success: "Review published", refresh: false, onOk: () => setList((l) => l.map((x) => (x.id === r.id ? { ...x, status: "published" } : x))) })}><Check className="size-3.5" /> Approve</Button>}
                  <Button size="sm" variant="outline" className="text-danger" onClick={() => act(() => moderateReview(r.id, "remove"), { success: "Review removed", refresh: false, onOk: () => setList((l) => l.filter((x) => x.id !== r.id)) })}><Trash2 className="size-3.5" /> Remove</Button>
                </div>
              ) : (
                <ReplyBox reviewId={r.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ReplyBox({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false); const [text, setText] = useState(""); const [sent, setSent] = useState(false);
  const { act, busy } = useAct();
  if (sent) return <p className="mt-4 border-t border-line pt-3.5 text-[13px] font-medium text-success">Reply posted ✓</p>;
  return (
    <div className="mt-4 border-t border-line pt-3.5">
      {!open ? <Button size="sm" variant="outline" onClick={() => setOpen(true)}><MessageSquare className="size-3.5" /> Reply publicly</Button> : (
        <div className="space-y-2.5">
          <Textarea aria-label="Your reply" rows={3} value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Thank the customer or address their concern…" />
          <div className="flex gap-2"><Button size="sm" loading={busy} onClick={() => act(() => replyToReview(reviewId, text), { success: "Reply posted", refresh: false, onOk: () => setSent(true) })}>Post reply</Button><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
        </div>
      )}
    </div>
  );
}
