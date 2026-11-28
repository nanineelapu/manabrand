import { WishlistView } from "@/components/store/wishlist-view";

import { pageMeta, privateMeta } from "@/lib/seo";
export const metadata = pageMeta(privateMeta("Your wishlist", "/wishlist"));

export default function WishlistPage() {
  return <WishlistView />;
}
