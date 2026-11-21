/** ManaBrand is a fashion marketplace. These category slugs came from the earlier general-store catalogue and are never shown. */
export const HIDDEN_CATEGORY_SLUGS = new Set(["electronics", "home", "beauty", "gourmet"]);

/** Cover photo for each fashion sub-category (used by the "Shop by category" tiles). */
export const SUB_PHOTO = {
  "Women's wear": "dress", "Men's wear": "shirt", "Ethnic wear": "saree", "Footwear": "sneaker",
  "Bags": "bag", "Jewellery": "jewellery", "Watches": "watch", "Eyewear": "sunglasses",
} as const;
