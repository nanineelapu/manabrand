import type { Category, Collection, Product, ProductColor, Seller } from "@/types";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";
import type { PhotoKind } from "@/lib/images";
import { mulberry32 } from "@/lib/utils";

/* ============================================================ Categories */
export const categories: Category[] = [
  { id: "c1", slug: "fashion", name: "Fashion", tagline: "Clothing & footwear for everyone", tone: ["#e7efe9", "#9ec3b0"], photo: "dress", productCount: 0 },
  { id: "c2", slug: "electronics", name: "Electronics", tagline: "Phones, audio, laptops & more", tone: ["#e4ebf3", "#9db6d3"], photo: "headphones", productCount: 0 },
  { id: "c3", slug: "home", name: "Home", tagline: "Furniture, decor and kitchen", tone: ["#f1ebdf", "#d1bd93"], photo: "sofa", productCount: 0 },
  { id: "c4", slug: "beauty", name: "Beauty", tagline: "Skincare, makeup, fragrance", tone: ["#f3e6e6", "#d7a9a9"], photo: "skincare", productCount: 0 },
  { id: "c5", slug: "accessories", name: "Accessories", tagline: "Bags, jewellery, watches", tone: ["#efe9dc", "#d0bd8a"], photo: "jewellery", productCount: 0 },
  { id: "c6", slug: "gourmet", name: "Gourmet", tagline: "Coffee, tea, spices & treats", tone: ["#f0e8dd", "#c9a77c"], photo: "coffee", productCount: 0 },
];

export const subcategories: Record<string, string[]> = {
  fashion: ["Women's wear", "Men's wear", "Ethnic wear", "Footwear"],
  electronics: ["Audio", "Laptops & Tablets", "Gaming", "Cameras"],
  home: ["Furniture", "Decor", "Kitchen", "Bedding"],
  beauty: ["Skincare", "Makeup", "Fragrance"],
  accessories: ["Bags", "Jewellery", "Watches", "Eyewear"],
  gourmet: ["Tea & Coffee", "Spices", "Snacks"],
};

/* =============================================================== Sellers */
const seller = (s: Omit<Seller, "productCount" | "permissions">): Seller => ({ ...s, productCount: 0, permissions: { ...DEFAULT_PERMISSIONS } });
export const sellers: Seller[] = [
  seller({ id: "s1", slug: "kalamkari-co", name: "Kalamkari & Co.", owner: "Meera Reddy", city: "Ichapuram", state: "Andhra Pradesh", email: "hello@kalamkari.in", phone: "+91 98480 11223", joined: "2025-02-14", status: "active", rating: 4.7, followers: 12840, totalSales: 4820000, commissionPct: 12, tone: ["#fdecc6", "#e09a1f"], blurb: "Hand-block printed cottons and natural-dye ethnic wear from local Ichapuram artisans.", kyc: "verified", gstin: "36AAKFK1234A1Z5" }),
  seller({ id: "s2", slug: "shekar-studio-gift-shop", name: "Shekar Studio & Gift Shop", owner: "S Shekar", city: "Ichapuram", state: "Andhra Pradesh", pickupAddress: "Near Sri Laxmi Surya Lodge, Ichapuram, Andhra Pradesh", email: "shekar.studio@example.com", phone: "+91 98250 44871", joined: "2025-03-02", status: "active", rating: 4.5, followers: 8420, totalSales: 3120000, commissionPct: 12, tone: ["#fbeccd", "#c9852b"], blurb: "Studio and gift shop in Ichapuram, near Sri Laxmi Surya Lodge — thoughtful gifts for every occasion.", kyc: "verified", gstin: "24AABCI5521M1ZQ" }),
  seller({ id: "s3", slug: "banarasi-house", name: "Banarasi House", owner: "Rukmini Devi", city: "Ichapuram", state: "Andhra Pradesh", email: "care@banarasihouse.com", phone: "+91 98390 22715", joined: "2025-01-20", status: "active", rating: 4.8, followers: 21300, totalSales: 8960000, commissionPct: 10, tone: ["#fbe4dc", "#b13a26"], blurb: "Silk sarees and fine jewellery from a family-run Ichapuram shop.", kyc: "verified", gstin: "09AAHFB9087K1Z2" }),
  seller({ id: "s4", slug: "urban-thread", name: "Urban Thread", owner: "Kabir Sethi", city: "Ichapuram", state: "Andhra Pradesh", email: "sell@urbanthread.co", phone: "+91 99020 33910", joined: "2025-05-11", status: "active", rating: 4.3, followers: 5230, totalSales: 1940000, commissionPct: 14, tone: ["#e6efe6", "#2f7d5b"], blurb: "Streetwear essentials — heavyweight tees, hoodies and layers, from an Ichapuram studio.", kyc: "verified", gstin: "29AAECU8812B1ZP" }),
  seller({ id: "s5", slug: "stride-lab", name: "Stride Lab", owner: "Naina Kapoor", city: "Ichapuram", state: "Andhra Pradesh", email: "hi@stridelab.in", phone: "+91 98110 90552", joined: "2025-06-30", status: "active", rating: 4.4, followers: 4120, totalSales: 1260000, commissionPct: 14, tone: ["#efe6f3", "#8b6bb0"], blurb: "Comfort-first sneakers, bags and eyewear, sold locally in Ichapuram.", kyc: "verified", gstin: "07AAMCS1190D1ZK" }),
  seller({ id: "s6", slug: "saanjh-studio", name: "Saanjh Studio", owner: "Priya Nair", city: "Ichapuram", state: "Andhra Pradesh", email: "studio@saanjh.in", phone: "+91 94470 66120", joined: "2026-09-18", status: "pending", rating: 0, followers: 0, totalSales: 0, commissionPct: 12, tone: ["#f3ead9", "#c9a45a"], blurb: "Festive and contemporary wear stitched by Ichapuram tailors.", kyc: "pending", gstin: "32AAJFS4433Q1ZX" }),
  seller({ id: "s7", slug: "tarang-weaves", name: "Tarang Weaves", owner: "Sanjay Patil", city: "Ichapuram", state: "Andhra Pradesh", email: "tarang@weaves.in", phone: "+91 98220 17788", joined: "2026-10-04", status: "pending", rating: 0, followers: 0, totalSales: 0, commissionPct: 12, tone: ["#e4e8ef", "#6b7a99"], blurb: "Festive wear from local Ichapuram tailors.", kyc: "pending", gstin: "27AAFCT7790R1ZE" }),
  seller({ id: "s8", slug: "voltedge", name: "VoltEdge", owner: "Rahul Anand", city: "Ichapuram", state: "Andhra Pradesh", email: "sell@voltedge.in", phone: "+91 98860 12044", joined: "2025-04-08", status: "active", rating: 4.6, followers: 16900, totalSales: 14200000, commissionPct: 8, tone: ["#dbe5f3", "#2a5db0"], blurb: "Ichapuram’s authorised reseller of phones, audio and laptops, with 1-year brand warranty.", kyc: "verified", gstin: "29AABCV3321K1ZB" }),
  seller({ id: "s9", slug: "hearth-and-home", name: "Hearth & Home", owner: "Sunita Joshi", city: "Ichapuram", state: "Andhra Pradesh", email: "care@hearthhome.in", phone: "+91 98290 55601", joined: "2025-07-19", status: "active", rating: 4.5, followers: 7340, totalSales: 5100000, commissionPct: 11, tone: ["#f1e6d3", "#a8764a"], blurb: "Local furniture, decor and kitchenware to make a house feel like home.", kyc: "verified", gstin: "08AAFCH6678L1ZR" }),
  seller({ id: "s10", slug: "glow-theory", name: "Glow Theory", owner: "Tara Menon", city: "Ichapuram", state: "Andhra Pradesh", email: "hello@glowtheory.in", phone: "+91 98200 31877", joined: "2025-08-25", status: "active", rating: 4.6, followers: 11200, totalSales: 3800000, commissionPct: 12, tone: ["#f6e3e3", "#c98a8a"], blurb: "Dermatologist-tested skincare, makeup and fragrance, available in Ichapuram.", kyc: "verified", gstin: "27AAGCG2210M1ZT" }),
  seller({ id: "s11", slug: "spice-route", name: "Spice Route Pantry", owner: "Vikram Pillai", city: "Ichapuram", state: "Andhra Pradesh", email: "orders@spiceroute.in", phone: "+91 94960 22310", joined: "2025-09-03", status: "active", rating: 4.7, followers: 6050, totalSales: 2300000, commissionPct: 10, tone: ["#f3e7d3", "#b9772b"], blurb: "Single-origin coffee, estate teas and whole spices, packed at an Ichapuram pantry.", kyc: "verified", gstin: "32AAHCS5543N1ZV" }),
];

/* ============================================================== Products */
const C = {
  vermilion: { name: "Vermilion", hex: "#cc4a33" }, indigo: { name: "Indigo", hex: "#34478f" }, marigold: { name: "Marigold", hex: "#e09a1f" },
  forest: { name: "Forest", hex: "#2f6b4f" }, ink: { name: "Black", hex: "#1f1f22" }, ivory: { name: "Ivory", hex: "#eee3d0" },
  rose: { name: "Dusty Rose", hex: "#c98a8a" }, teal: { name: "Teal", hex: "#2a7f84" }, plum: { name: "Plum", hex: "#6e3a5c" },
  sky: { name: "Sky", hex: "#7fa6d1" }, olive: { name: "Olive", hex: "#7a7a3a" }, sand: { name: "Sand", hex: "#cdb48c" },
  maroon: { name: "Maroon", hex: "#7d2335" }, mint: { name: "Mint", hex: "#8bc3a8" }, denim: { name: "Mid Denim", hex: "#4a6fa5" },
  charcoal: { name: "Charcoal", hex: "#45464a" }, white: { name: "White", hex: "#f3f0ea" }, tan: { name: "Tan", hex: "#a8764a" },
  silver: { name: "Silver", hex: "#c9ccd1" }, ocean: { name: "Ocean Blue", hex: "#2a5db0" }, gold: { name: "Gold", hex: "#d4a94f" },
  rosegold: { name: "Rose Gold", hex: "#d9a58f" }, emerald: { name: "Emerald", hex: "#0f6b52" }, grey: { name: "Slate Grey", hex: "#7b8089" },
  oak: { name: "Natural Oak", hex: "#b98f5e" }, std: { name: "Standard", hex: "#d9d3c7" },
} satisfies Record<string, ProductColor>;

const O = {
  apparel: ["XS", "S", "M", "L", "XL", "XXL"], jeans: ["28", "30", "32", "34", "36"], shoes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
  free: ["Free Size"], one: ["One Size"], std: ["Standard"], storage: ["128GB", "256GB"], config: ["8GB / 256GB", "16GB / 512GB"],
  vol: ["30ml", "50ml"], perf: ["50ml", "100ml"], pack: ["250g", "500g", "1kg"], bed: ["Single", "Double", "King"], candle: ["200g", "400g"],
};

type Seed = [
  name: string, cat: string, sub: string, photo: PhotoKind, seller: string, price: number, mrp: number,
  colors: ProductColor[], options: string[], optionLabel: string, flags: string,
];
// flags: n=new b=bestseller s=sale l=limited
const seeds: Seed[] = [
  // ---- Fashion
  ["Jaipur Bloom Cotton Kurta", "fashion", "Ethnic wear", "kurta", "s1", 1299, 2199, [C.vermilion, C.indigo, C.marigold], O.apparel, "Size", "bs"],
  ["Hand-block Kurta Set", "fashion", "Ethnic wear", "kurta", "s1", 2199, 3499, [C.teal, C.rose, C.ivory], O.apparel, "Size", "bn"],
  ["Natural-dye Cotton Saree", "fashion", "Ethnic wear", "saree", "s1", 2899, 4200, [C.forest, C.maroon], O.free, "Size", "n"],
  ["Kanjivaram Silk Saree", "fashion", "Ethnic wear", "saree", "s3", 14999, 21999, [C.maroon, C.marigold, C.forest], O.free, "Size", "bl"],
  ["Banarasi Georgette Saree", "fashion", "Ethnic wear", "saree", "s3", 8999, 12999, [C.plum, C.teal], O.free, "Size", "b"],
  ["Chikankari Georgette Kurta", "fashion", "Ethnic wear", "kurta", "s3", 2799, 4299, [C.ivory, C.mint, C.rose], O.apparel, "Size", "n"],
  ["Slim Fit Oxford Shirt", "fashion", "Men's wear", "shirt", "s4", 1499, 2299, [C.sky, C.white, C.ink], O.apparel, "Size", "bs"],
  ["Chambray Relaxed Shirt", "fashion", "Men's wear", "shirt", "s4", 1799, 2799, [C.denim, C.sand], O.apparel, "Size", "n"],
  ["Linen Camp-collar Shirt", "fashion", "Men's wear", "shirt", "s4", 1699, 2499, [C.olive, C.sand, C.ivory], O.apparel, "Size", "n"],
  ["Selvedge Straight Jeans", "fashion", "Men's wear", "jeans", "s4", 2499, 3999, [C.denim, C.ink], O.jeans, "Size", "b"],
  ["Washed Black Slim Jeans", "fashion", "Men's wear", "jeans", "s4", 1999, 2999, [C.ink, C.charcoal], O.jeans, "Size", "s"],
  ["Heavyweight Boxy Tee", "fashion", "Men's wear", "tee", "s4", 999, 1599, [C.ink, C.white, C.olive, C.sand], O.apparel, "Size", "bs"],
  ["Oversized Fleece Hoodie", "fashion", "Men's wear", "hoodie", "s4", 2299, 3499, [C.charcoal, C.forest, C.sand], O.apparel, "Size", "b"],
  ["Quilted Bomber Jacket", "fashion", "Men's wear", "jacket", "s4", 3999, 5999, [C.olive, C.ink], O.apparel, "Size", "s"],
  ["Washed Denim Trucker Jacket", "fashion", "Men's wear", "jacket", "s4", 3299, 4999, [C.denim, C.ink], O.apparel, "Size", "n"],
  ["Floral Wrap Dress", "fashion", "Women's wear", "dress", "s1", 2699, 3999, [C.marigold, C.teal], O.apparel, "Size", "b"],
  ["Ribbed Wrap Midi Dress", "fashion", "Women's wear", "dress", "s4", 2499, 3799, [C.plum, C.ink, C.rose], O.apparel, "Size", "n"],
  ["Pleated A-line Midi Dress", "fashion", "Women's wear", "dress", "s4", 2199, 3299, [C.forest, C.rose, C.ink], O.apparel, "Size", "s"],
  ["Soft Knit Everyday Tee", "fashion", "Women's wear", "tee", "s4", 899, 1499, [C.rose, C.white, C.mint, C.ink], O.apparel, "Size", "bs"],
  ["High-rise Mom Jeans", "fashion", "Women's wear", "jeans", "s4", 2199, 3299, [C.denim, C.white], O.jeans, "Size", "s"],
  ["Cloudstep Everyday Sneakers", "fashion", "Footwear", "sneaker", "s5", 2999, 4499, [C.white, C.ink, C.sand], O.shoes, "Size", "bs"],
  ["Retro Runner Sneakers", "fashion", "Footwear", "sneaker", "s5", 3499, 4999, [C.vermilion, C.teal, C.white], O.shoes, "Size", "n"],
  ["Canvas Court Low-tops", "fashion", "Footwear", "sneaker", "s5", 1999, 2999, [C.indigo, C.white], O.shoes, "Size", "s"],
  // ---- Accessories
  ["Market Tote Bag", "accessories", "Bags", "bag", "s5", 1499, 2199, [C.tan, C.ink, C.vermilion], O.one, "Size", "b"],
  ["Slouchy Leather Shoulder Bag", "accessories", "Bags", "bag", "s5", 3299, 4999, [C.tan, C.maroon], O.one, "Size", "ns"],
  ["Pearl Strand Necklace", "accessories", "Jewellery", "jewellery", "s3", 1899, 2999, [C.ivory], O.one, "Size", "bn"],
  ["Gold-tone Hoop Earrings", "accessories", "Jewellery", "jewellery", "s3", 799, 1299, [C.gold], O.one, "Size", "bs"],
  ["Polki Statement Earrings", "accessories", "Jewellery", "jewellery", "s3", 2499, 3999, [C.gold, C.silver], O.one, "Size", "l"],
  ["Classic Steel Watch", "accessories", "Watches", "watch", "s8", 4999, 7999, [C.silver, C.ink, C.rosegold], O.std, "Standard", "b"],
  ["Smart Fitness Watch", "accessories", "Watches", "watch", "s8", 5999, 8999, [C.ink, C.silver], O.std, "Standard", "n"],
  ["Aviator Sunglasses", "accessories", "Eyewear", "sunglasses", "s5", 1299, 2199, [C.ink, C.gold], O.std, "Standard", "s"],
  // ---- Electronics
  ["ANC Wireless Headphones", "electronics", "Audio", "headphones", "s8", 6999, 10999, [C.ink, C.silver], O.std, "Standard", "bs"],
  ["TrueSound Earbuds", "electronics", "Audio", "earbuds", "s8", 2999, 4999, [C.white, C.ink], O.std, "Standard", "b"],
  ["Portable Bluetooth Speaker", "electronics", "Audio", "speaker", "s8", 3499, 4999, [C.ink, C.ocean], O.std, "Standard", "s"],
  ["Smart Home Speaker", "electronics", "Audio", "speaker", "s8", 4499, 5999, [C.white, C.charcoal], O.std, "Standard", "n"],
  ["UltraBook 14 Laptop", "electronics", "Laptops & Tablets", "laptop", "s8", 64999, 74999, [C.silver, C.grey], O.config, "Config", "b"],
  ["Creator Laptop Pro", "electronics", "Laptops & Tablets", "laptop", "s8", 99999, 119999, [C.grey], O.config, "Config", "l"],
  ["10-inch Slate Tablet", "electronics", "Laptops & Tablets", "tablet", "s8", 19999, 24999, [C.silver, C.ink], O.storage, "Storage", "n"],
  ["Instant Print Camera", "electronics", "Cameras", "camera", "s8", 8999, 11999, [C.white], O.std, "Standard", "s"],
  ["Gaming Starter Kit", "electronics", "Gaming", "gaming", "s8", 5999, 8499, [C.ink], O.std, "Standard", "b"],
  // ---- Home
  ["Emerald Velvet Sofa", "home", "Furniture", "sofa", "s9", 38999, 52999, [C.emerald, C.grey], O.std, "Standard", "l"],
  ["Solid Oak Side Stool", "home", "Furniture", "furniture", "s9", 3499, 4999, [C.oak], O.std, "Standard", "b"],
  ["Cream Accent Armchair", "home", "Furniture", "furniture", "s9", 12999, 17999, [C.ivory, C.sand], O.std, "Standard", "n"],
  ["Gallery Wall Decor Set", "home", "Decor", "decor", "s9", 1999, 3299, [C.std], O.std, "Standard", "b"],
  ["Soy Wax Scented Candle", "home", "Decor", "candle", "s2", 699, 999, [C.std], O.candle, "Weight", "bs"],
  ["Potted Aloe Planter", "home", "Decor", "plant", "s9", 599, 899, [C.mint, C.white], O.std, "Standard", "n"],
  ["Stoneware Dinner Set", "home", "Kitchen", "kitchen", "s9", 3299, 4999, [C.white, C.sand], O.std, "Standard", "s"],
  ["Glass Jar Blender", "home", "Kitchen", "kitchen", "s9", 2599, 3799, [C.silver], O.std, "Standard", "b"],
  ["Insulated Steel Bottle", "home", "Kitchen", "bottle", "s9", 899, 1299, [C.forest, C.ink, C.sand], O.std, "Standard", "b"],
  ["Cotton Percale Bedsheet", "home", "Bedding", "bedding", "s9", 1799, 2799, [C.white, C.sky, C.sand], O.bed, "Size", "bs"],
  ["Hotel Pillow (Set of 2)", "home", "Bedding", "bedding", "s9", 1299, 1999, [C.white], O.std, "Standard", "s"],
  // ---- Beauty
  ["Barrier Repair Moisturiser", "beauty", "Skincare", "skincare", "s10", 799, 1199, [C.std], O.vol, "Volume", "bs"],
  ["Vitamin C Brightening Serum", "beauty", "Skincare", "skincare", "s10", 999, 1499, [C.std], O.vol, "Volume", "b"],
  ["Gentle Foaming Cleanser", "beauty", "Skincare", "skincare", "s10", 599, 899, [C.std], O.vol, "Volume", "n"],
  ["Repair Hair Mask", "beauty", "Skincare", "skincare", "s10", 749, 1099, [C.std], O.vol, "Volume", "n"],
  ["Everyday Makeup Kit", "beauty", "Makeup", "makeup", "s10", 1499, 2499, [C.rose, C.sand], O.std, "Standard", "s"],
  ["Blush & Highlighter Duo", "beauty", "Makeup", "makeup", "s10", 899, 1399, [C.rose, C.rosegold], O.std, "Standard", "n"],
  ["Eau de Parfum Noir", "beauty", "Fragrance", "perfume", "s2", 2999, 4499, [C.std], O.perf, "Volume", "b"],
  ["Citrus Cologne", "beauty", "Fragrance", "perfume", "s10", 1999, 2999, [C.std], O.perf, "Volume", "n"],
  // ---- Gourmet
  ["Single-origin Coffee Beans", "gourmet", "Tea & Coffee", "coffee", "s11", 599, 799, [C.std], O.pack, "Pack", "b"],
  ["Assam Black Tea", "gourmet", "Tea & Coffee", "tea", "s11", 449, 649, [C.std], O.pack, "Pack", "n"],
  ["Whole Spice Collection", "gourmet", "Spices", "spices", "s11", 899, 1299, [C.std], O.std, "Standard", "b"],
  ["Garam Masala Blend", "gourmet", "Spices", "spices", "s11", 299, 449, [C.std], O.pack, "Pack", "n"],
  ["Dark Chocolate Gift Box", "gourmet", "Snacks", "snacks", "s2", 799, 1099, [C.std], O.std, "Standard", "bs"],
  ["Roasted Nut & Berry Mix", "gourmet", "Snacks", "snacks", "s11", 549, 799, [C.std], O.pack, "Pack", ""],
];

const copy: Record<string, { desc: string[]; spec: (s: Seed) => string; care: string[]; details: string[] }> = {
  fashion: {
    desc: ["Cut for easy movement and finished with care by small-batch makers. Pairs as well with sneakers as it does with festive jewellery.", "A staple designed to be worn on repeat. Soft hand-feel from the first wear and built to hold shape wash after wash."],
    spec: (s) => ({ kurta: "100% handloom cotton", saree: "Handwoven fabric, 5.5 m + blouse piece", shirt: "Premium woven cotton", tee: "240 GSM combed cotton jersey", jacket: "Cotton twill / denim", jeans: "98% cotton, 2% elastane denim", hoodie: "320 GSM brushed fleece", dress: "Viscose crepe, fully lined", sneaker: "Breathable mesh upper, EVA sole" } as Record<string, string>)[s[3]] ?? "Premium fabric",
    care: ["Machine wash cold, gentle cycle", "Wash dark colours separately", "Dry in shade"],
    details: ["True-to-size fit", "Colour may vary slightly with screen settings", "Made in India"],
  },
  accessories: {
    desc: ["Designed to last and made to be noticed. Quietly well-made, with finishing you can feel."],
    spec: (s) => ({ bag: "Vegan leather with cotton lining", jewellery: "Gold-plated brass, hypoallergenic", watch: "Stainless steel, sapphire-coated glass", sunglasses: "UV400 polarised lenses" } as Record<string, string>)[s[3]] ?? "Premium materials",
    care: ["Store in the pouch provided", "Wipe clean with a soft dry cloth", "Avoid contact with perfume"],
    details: ["Gift-ready packaging", "6-month warranty on defects", "Authenticity card included"],
  },
  electronics: {
    desc: ["Genuine product with full manufacturer warranty, sold and shipped by a verified authorised seller."],
    spec: () => "1-year brand warranty · GST invoice included · Box: device, charger, cable",
    care: ["Keep away from water unless rated", "Use the original charger", "Update firmware regularly"],
    details: ["1-year manufacturer warranty", "7-day replacement for defects", "No-cost EMI available"],
  },
  home: {
    desc: ["Thoughtfully made for everyday living. Sturdy materials and a timeless look that settles into any room."],
    spec: (s) => ({ sofa: "Kiln-dried wood frame, high-density foam, velvet upholstery", furniture: "Solid wood / engineered frame", decor: "Mixed materials, ready to hang", candle: "100% soy wax, cotton wick, 40-hour burn", plant: "Live plant in ceramic pot", kitchen: "Food-safe, dishwasher-safe materials", bottle: "Double-wall 304 stainless steel, 24h cold", bedding: "100% cotton percale, 200 thread count" } as Record<string, string>)[s[3]] ?? "Quality materials",
    care: ["Wipe with a damp cloth", "Avoid direct sunlight for long periods", "Follow the included care card"],
    details: ["Assembly support on request", "7-day return policy", "Made in India"],
  },
  beauty: {
    desc: ["Dermatologist-tested formulas made without parabens or sulphates. Suitable for all skin types."],
    spec: () => "Cruelty-free · Paraben-free · Dermatologist tested",
    care: ["Patch-test before first use", "Store in a cool, dry place", "Use within 12 months of opening"],
    details: ["Sealed & batch-coded", "Genuine product guarantee", "Not returnable once opened"],
  },
  gourmet: {
    desc: ["Sourced directly from growers and packed fresh in small batches — no preservatives or artificial flavours."],
    spec: () => "Freshly packed · No preservatives · Vegetarian",
    care: ["Store in an airtight container", "Keep away from moisture and heat", "Best consumed within 6 months"],
    details: ["Best-before printed on pack", "FSSAI licensed kitchen", "Free shipping above ₹1,499"],
  },
};

const rnd = mulberry32(42);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const products: Product[] = seeds.map((s, i) => {
  const [name, cat, sub, photo, seller, price, mrp, colors, options, optionLabel, flags] = s;
  const stock: Record<string, number> = {};
  options.forEach((o) => { const sold = rnd() < 0.1 && options.length > 1; stock[o] = sold ? 0 : Math.floor(rnd() * 28) + 2; });
  if (name === "Selvedge Straight Jeans") Object.keys(stock).forEach((k) => (stock[k] = k === "32" ? 2 : 0)); // low-stock exemplar
  const badges = [flags.includes("n") && "new", flags.includes("b") && "bestseller", flags.includes("s") && "sale", flags.includes("l") && "limited"].filter(Boolean) as Product["badges"];
  const reviewCount = Math.floor(rnd() * 480) + 18;
  const day = 28 - Math.floor(rnd() * 28) - (flags.includes("n") ? 0 : 40);
  const c = copy[cat];
  return {
    id: `p${i + 1}`, slug: slug(name), name, sellerId: seller, categorySlug: cat, subcategory: sub, photo, price, mrp, colors, optionLabel,
    sizes: options, stock, rating: Math.round((3.9 + rnd() * 1.0) * 10) / 10, reviewCount, sold: Math.floor(reviewCount * (2 + rnd() * 4)),
    badges, description: c.desc[i % c.desc.length], fabric: c.spec(s), care: c.care, details: c.details,
    createdAt: new Date(Date.UTC(2026, 9, 31 + day)).toISOString(),
    status: name === "Classic Steel Watch" ? "pending_review" : name === "Gaming Starter Kit" ? "draft" : Object.values(stock).every((v) => v === 0) ? "out_of_stock" : "active",
    tags: [cat, sub.toLowerCase(), photo, ...colors.map((x) => x.name.toLowerCase())], images: [],
  };
});

// derive counts
categories.forEach((c) => { c.productCount = products.filter((p) => p.categorySlug === c.slug && p.status === "active").length; });
sellers.forEach((s) => { s.productCount = products.filter((p) => p.sellerId === s.id).length; });

/* ============================================================ Collections */
const byNames = (...names: string[]) => products.filter((p) => names.some((n) => p.name.startsWith(n))).map((p) => p.id);
export const collections: Collection[] = [
  { id: "col1", slug: "wedding-edit", name: "The Wedding Edit", story: "Silk sarees, statement jewellery and festive wear for the season of shaadis.", tone: ["#f3e6e6", "#b13a26"], photo: "saree", productIds: byNames("Kanjivaram", "Banarasi", "Natural-dye", "Polki", "Pearl", "Hand-block Kurta Set", "Chikankari") },
  { id: "col2", slug: "work-from-home", name: "Work From Home", story: "Laptops, headphones and desk essentials to build a setup you enjoy.", tone: ["#e4ebf3", "#2a5db0"], photo: "laptop", productIds: byNames("UltraBook", "ANC Wireless", "10-inch", "Solid Oak", "Insulated", "Portable Bluetooth", "TrueSound") },
  { id: "col3", slug: "gift-guide", name: "The Gift Guide", story: "Perfume, candles, chocolates and watches — presents people actually want.", tone: ["#f0e6dc", "#a8764a"], photo: "perfume", productIds: byNames("Eau de Parfum", "Citrus", "Soy Wax", "Dark Chocolate", "Smart Fitness", "Gold-tone", "Single-origin") },
  { id: "col4", slug: "home-refresh", name: "Home Refresh", story: "Sofas, decor and bedding to give any room a fresh start.", tone: ["#efe9dc", "#0f6b52"], photo: "decor", productIds: byNames("Emerald", "Cream Accent", "Gallery Wall", "Cotton Percale", "Potted Aloe", "Stoneware", "Hotel Pillow") },
];

/* ================================================================ Lookups */
export const sellerById = (id: string) => sellers.find((s) => s.id === id);
export const productById = (id: string) => products.find((p) => p.id === id);
