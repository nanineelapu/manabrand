import { Skeleton } from "@/components/ui/display";

export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-2"><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-80 max-w-full" /></div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[118px]" />)}</div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
    </div>
  );
}
