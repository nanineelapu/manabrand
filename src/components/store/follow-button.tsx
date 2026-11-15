"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/actions/store";
import { useAct } from "@/lib/actions/use-act";
import { useRouter } from "next/navigation";

export function FollowButton({ sellerId, name, initialFollowing = false }: { sellerId: string; name: string; initialFollowing?: boolean }) {
  const [on, setOn] = useState(initialFollowing);
  const { act, busy } = useAct();
  const router = useRouter();
  return (
    <Button variant={on ? "outline" : "primary"} className="rounded-full" aria-pressed={on} loading={busy}
      onClick={async () => {
        const r = await act(() => toggleFollow(sellerId), { onOk: (res) => setOn("following" in res ? Boolean(res.following) : !on), onDemo: () => setOn(!on), success: on ? `Unfollowed ${name}` : `Following ${name}` });
        if (r && !r.ok && !r.demo && /sign in/i.test(r.error ?? "")) router.push("/login");
      }}>
      {on ? <><Check className="size-4" /> Following</> : <><Plus className="size-4" /> Follow</>}
    </Button>
  );
}
