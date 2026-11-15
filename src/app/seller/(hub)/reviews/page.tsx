import { PageHeader } from "@/components/shared/blocks";
import { ReviewsModeration } from "@/components/admin/reviews-moderation";
import { getSellerReviews } from "@/lib/data";

export const metadata = { title: "Reviews" };

export default async function SellerReviewsPage() {
  const reviews = await getSellerReviews();
  return (
    <>
      <PageHeader title="Customer reviews" subtitle="Reply publicly — shoppers read your responses" />
      <ReviewsModeration reviews={reviews} canModerate={false} />
    </>
  );
}
