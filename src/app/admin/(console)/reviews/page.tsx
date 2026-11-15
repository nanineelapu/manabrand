import { PageHeader } from "@/components/shared/blocks";
import { ReviewsModeration } from "@/components/admin/reviews-moderation";
import { getAllProducts, getAllReviews } from "@/lib/data";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const [reviews, products] = await Promise.all([getAllReviews(), getAllProducts()]);
  const names = Object.fromEntries(products.map((p) => [p.id, p.name]));
  return (
    <>
      <PageHeader title="Review moderation" subtitle="Keep reviews genuine and helpful" />
      <ReviewsModeration reviews={reviews.map((r) => ({ ...r, productName: names[r.productId] ?? "" }))} />
    </>
  );
}
