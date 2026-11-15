import { Skeleton } from "@/components/ui/display";

export default function Loading() {
  return (
    <div className="container-page space-y-6 py-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="space-y-2"><Skeleton className="aspect-[3/4] rounded-card" /><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-3/4" /></div>)}
      </div>
    </div>
  );
}
