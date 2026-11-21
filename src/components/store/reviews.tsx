import { BadgeCheck, ThumbsUp } from "lucide-react";
import { Avatar, Rating } from "@/components/ui/display";
import { formatDate } from "@/lib/utils";
import { WriteReview } from "./write-review";
import type { Product, Review } from "@/types";

export function ReviewsSection({ product, reviews, breakdown }: { product: Product; reviews: Review[]; breakdown: { star: number; count: number }[] }) {
  const total = breakdown.reduce((a, b) => a + b.count, 0) || 1;
  return (
    <section id="reviews" aria-labelledby="rev-h" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="rev-h" className="font-display text-2xl font-semibold md:text-3xl">Ratings & reviews</h2><WriteReview productId={product.id} productName={product.name} /></div>
      <div className="mt-5 grid gap-6 md:grid-cols-[260px_1fr] md:gap-10">
        <div className="flex items-center gap-5 rounded-card bg-bg-subtle p-5 md:flex-col md:items-start md:gap-4">
          <div>
            <p className="font-display text-5xl font-semibold leading-none tabular">{product.rating.toFixed(1)}</p>
            <Rating value={product.rating} showValue={false} size="md" className="mt-2" />
            <p className="mt-1 text-xs text-muted">{product.reviewCount} ratings</p>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5 md:w-full" aria-label="Rating distribution">
            {breakdown.map((b) => (
              <li key={b.star} className="flex items-center gap-2 text-xs tabular">
                <span className="w-3">{b.star}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-gold-500" style={{ width: `${(b.count / total) * 100}%` }} /></span>
                <span className="w-5 text-right text-muted">{b.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <ul className="divide-y divide-line">
          {reviews.length === 0 && <li className="py-6 text-sm text-muted">No reviews yet — be the first to review this product.</li>}
          {reviews.slice(0, 5).map((r) => (
            <li key={r.id} className="py-5 first:pt-0">
              <div className="flex items-center gap-3">
                <Avatar name={r.author} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.author} <span className="font-normal text-muted">· {r.city}</span></p>
                  <p className="text-xs text-subtle">{formatDate(r.date)}</p>
                </div>
                {r.verified && <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success"><BadgeCheck className="size-4" /> Verified</span>}
              </div>
              <Rating value={r.rating} showValue={false} className="mt-3" />
              <h3 className="mt-1.5 text-[15px] font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{r.body}</p>
              {r.images && r.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noopener noreferrer" aria-label="Open review photo" className="block size-20 overflow-hidden rounded-lg border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="Customer photo" loading="lazy" className="size-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-muted"><ThumbsUp className="size-3.5" /> Helpful ({r.helpful})</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
