import type { Category, Collection, Product, ProductColor, Seller } from "@/types";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";
import type { PhotoKind } from "@/lib/images";
import { mulberry32 } from "@/lib/utils";
import { TAXONOMY } from "@/lib/taxonomy";

/* ============================================================ Categories */
export const categories: Category[] = TAXONOMY.map((t, i) => ({
  id: `c${i + 1}`, slug: t.slug, name: t.name, tagline: t.comingSoon ? "Launching soon" : `${t.subs.slice(0, 3).join(", ")} & more`,
  tone: ["#e7efe9", "#9ec3b0"] as [string, string], photo: t.photo, productCount: 0,
}));

export const subcategories: Record<string, string[]> = Object.fromEntries(TAXONOMY.filter((t) => t.subs.length).map((t) => [t.slug, t.subs]));

/* =============================================================== Sellers */
const seller = (s: Omit<Seller, "productCount" | "permissions">): Seller => ({ ...s, productCount: 0, permissions: { ...DEFAULT_PERMISSIONS } });
export const sellers: Seller[] = [
  seller({ id: "s1", slug: "kalamkari-co", name: "Kalamkari & Co.", owner: "Meera Reddy", city: "Ichapuram", state: "Andhra Pradesh", email: "hello@kalamkari.in", phone: "+91 98480 11223", joined: "2025-02-14", status: "active", rating: 4.7, followers: 12840, totalSales: 4820000, commissionPct: 12, tone: ["#fdecc6", "#e09a1f"], blurb: "Hand-block printed cottons and natural-dye ethnic wear from local Ichapuram artisans.", kyc: "verified", gstin: "36AAKFK1234A1Z5" }),
  seller({ id: "s2", slug: "shekar-studio-gift-shop", name: "Shekar Studio & Gift Shop", owner: "S Shekar", city: "Ichapuram", state: "Andhra Pradesh", pickupAddress: "Near Sri Laxmi Surya Lodge, Ichapuram, Andhra Pradesh", email: "shekar.studio@example.com", phone: "+91 98250 44871", joined: "2025-03-02", status: "active", rating: 4.5, followers: 8420, totalSales: 3120000, commissionPct: 12, tone: ["#fbeccd", "#c9852b"], blurb: "Studio and gift shop in Ichapuram, near Sri Laxmi Surya Lodge — thoughtful gifts for every occasion.", kyc: "verified", gstin: "24AABCI5521M1ZQ" }),
  seller({ id: "s3", slug: "banarasi-house", name: "Banarasi House", owner: "Rukmini Devi", city: "Ichapuram", state: "Andhra Pradesh", email: "care@banarasihouse.com", phone: "+91 98390 22715", joined: "2025-01-20", status: "active", rating: 4.8, followers: 21300, totalSales: 8960000, commissionPct: 10, tone: ["#fbe4dc", "#b13a26"], blurb: "Silk sarees, lehengas and festive wear from a family-run Ichapuram shop.", kyc: "verified", gstin: "09AAHFB9087K1Z2" }),
  seller({ id: "s4", slug: "urban-thread", name: "Urban Thread", owner: "Kabir Sethi", city: "Ichapuram", state: "Andhra Pradesh", email: "sell@urbanthread.co", phone: "+91 99020 33910", joined: "2025-05-11", status: "active", rating: 4.3, followers: 5230, totalSales: 1940000, commissionPct: 14, tone: ["#e6efe6", "#2f7d5b"], blurb: "Streetwear essentials — tees, shirts, denim and everyday menswear, from an Ichapuram studio.", kyc: "verified", gstin: "29AAECU8812B1ZP" }),
  seller({ id: "s5", slug: "stride-lab", name: "Stride Lab", owner: "Naina Kapoor", city: "Ichapuram", state: "Andhra Pradesh", email: "hi@stridelab.in", phone: "+91 98110 90552", joined: "2025-06-30", status: "pending", rating: 0, followers: 0, totalSales: 0, commissionPct: 14, tone: ["#efe6f3", "#8b6bb0"], blurb: "Comfort-first footwear from Ichapuram — launching soon on ManaBrand.", kyc: "pending", gstin: "07AAMCS1190D1ZK" }),
  seller({ id: "s6", slug: "saanjh-studio", name: "Saanjh Studio", owner: "Priya Nair", city: "Ichapuram", state: "Andhra Pradesh", email: "studio@saanjh.in", phone: "+91 94470 66120", joined: "2026-09-18", status: "pending", rating: 0, followers: 0, totalSales: 0, commissionPct: 12, tone: ["#f3ead9", "#c9a45a"], blurb: "Festive and contemporary wear stitched by Ichapuram tailors.", kyc: "pending", gstin: "32AAJFS4433Q1ZX" }),
  seller({ id: "s7", slug: "tarang-weaves", name: "Tarang Weaves", owner: "Sanjay Patil", city: "Ichapuram", state: "Andhra Pradesh", email: "tarang@weaves.in", phone: "+91 98220 17788", joined: "2026-10-04", status: "pending", rating: 0, followers: 0, totalSales: 0, commissionPct: 12, tone: ["#e4e8ef", "#6b7a99"], blurb: "Festive wear from local Ichapuram tailors.", kyc: "pending", gstin: "27AAFCT7790R1ZE" }),
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
  // ======== Men's Fashion
  ["Heavyweight Boxy Tee", "men-t-shirts", "Oversized", "tee", "s4", 999, 1599, [C.ink, C.white, C.olive, C.sand], O.apparel, "Size", "bs"],
  ["Classic Pique Polo", "men-t-shirts", "Polo", "tee", "s4", 1199, 1799, [C.ink, C.sky, C.forest], O.apparel, "Size", "n"],
  ["Slim Fit Crew Tee", "men-t-shirts", "Slim Fit", "tee", "s2", 799, 1299, [C.white, C.charcoal, C.ocean], O.apparel, "Size", "bs"],
  ["Graphic Print Tee", "men-t-shirts", "Printed", "tee", "s2", 899, 1499, [C.ink, C.sand], O.apparel, "Size", "s"],
  ["Slim Fit Oxford Shirt", "men-shirts", "Formal", "shirt", "s4", 1499, 2299, [C.sky, C.white, C.ink], O.apparel, "Size", "bs"],
  ["Chambray Relaxed Shirt", "men-shirts", "Denim", "shirt", "s4", 1799, 2799, [C.denim, C.sand], O.apparel, "Size", "n"],
  ["Linen Camp-collar Shirt", "men-shirts", "Casual", "shirt", "s4", 1699, 2499, [C.olive, C.sand, C.ivory], O.apparel, "Size", "n"],
  ["Checked Flannel Shirt", "men-shirts", "Checked", "shirt", "s2", 1599, 2399, [C.maroon, C.forest], O.apparel, "Size", "s"],
  ["Selvedge Straight Jeans", "men-jeans", "Straight Fit", "jeans", "s4", 2499, 3999, [C.denim, C.ink], O.jeans, "Size", "b"],
  ["Washed Black Slim Jeans", "men-jeans", "Slim Fit", "jeans", "s4", 1999, 2999, [C.ink, C.charcoal], O.jeans, "Size", "s"],
  ["Relaxed Stone-wash Jeans", "men-jeans", "Relaxed Fit", "jeans", "s2", 2199, 3299, [C.denim, C.sky], O.jeans, "Size", "n"],
  ["Stretch Cotton Chinos", "men-pants-trousers", "Chinos", "jeans", "s4", 1599, 2399, [C.sand, C.olive, C.ink], O.jeans, "Size", "bs"],
  ["Utility Cargo Pants", "men-pants-trousers", "Cargo Pants", "jeans", "s4", 2099, 3199, [C.olive, C.charcoal], O.jeans, "Size", "n"],
  ["Everyday Joggers", "men-pants-trousers", "Joggers", "jeans", "s2", 1299, 1999, [C.charcoal, C.ink, C.grey], O.apparel, "Size", "s"],
  ["Pleated Formal Trousers", "men-pants-trousers", "Formal Pants", "jeans", "s4", 1899, 2799, [C.ink, C.charcoal], O.jeans, "Size", "b"],
  ["Jaipur Bloom Cotton Kurta", "men-ethnic-wear", "Kurtas", "kurta", "s1", 1299, 2199, [C.vermilion, C.indigo, C.marigold], O.apparel, "Size", "bs"],
  ["Hand-block Kurta Set", "men-ethnic-wear", "Kurta Sets", "kurta", "s1", 2199, 3499, [C.teal, C.rose, C.ivory], O.apparel, "Size", "bn"],
  ["Embroidered Festive Sherwani", "men-ethnic-wear", "Sherwanis", "kurta", "s3", 6999, 9999, [C.ivory, C.maroon], O.apparel, "Size", "l"],
  ["Washed Denim Shorts", "men-shorts", "Denim Shorts", "jeans", "s4", 1299, 1999, [C.denim, C.ink], O.jeans, "Size", "s"],
  ["Utility Cargo Shorts", "men-shorts", "Cargo Shorts", "jeans", "s4", 1399, 2099, [C.olive, C.sand], O.apparel, "Size", "n"],
  ["Cotton Casual Shorts", "men-shorts", "Cotton Shorts", "tee", "s2", 899, 1399, [C.sky, C.white, C.sand], O.apparel, "Size", "bs"],
  // ======== Women's Fashion
  ["Soft Knit Everyday Tee", "women-tops-t-shirts", "Basic Tops", "tee", "s4", 899, 1499, [C.rose, C.white, C.mint, C.ink], O.apparel, "Size", "bs"],
  ["Cropped Ribbed Top", "women-tops-t-shirts", "Crop Tops", "tee", "s4", 799, 1299, [C.ink, C.ivory, C.rose], O.apparel, "Size", "n"],
  ["Floral Printed Top", "women-tops-t-shirts", "Printed Tops", "tee", "s2", 999, 1599, [C.mint, C.rose], O.apparel, "Size", "s"],
  ["Jaipur Bloom Straight Kurti", "women-kurtis-kurtas", "Straight Kurtis", "kurta", "s1", 1199, 1999, [C.vermilion, C.indigo], O.apparel, "Size", "bs"],
  ["Chikankari Georgette Kurta", "women-kurtis-kurtas", "Long Kurtis", "kurta", "s3", 2799, 4299, [C.ivory, C.mint, C.rose], O.apparel, "Size", "n"],
  ["Block-print A-line Kurti", "women-kurtis-kurtas", "A-Line Kurtis", "kurta", "s1", 1499, 2299, [C.marigold, C.teal], O.apparel, "Size", "b"],
  ["Festive Floor-length Anarkali", "women-kurtis-kurtas", "Anarkali", "kurta", "s3", 3499, 5499, [C.maroon, C.emerald], O.apparel, "Size", "l"],
  ["Natural-dye Cotton Saree", "women-sarees", "Cotton", "saree", "s1", 2899, 4200, [C.forest, C.maroon], O.free, "Size", "n"],
  ["Kanjivaram Silk Saree", "women-sarees", "Silk", "saree", "s3", 14999, 21999, [C.maroon, C.marigold, C.forest], O.free, "Size", "bl"],
  ["Banarasi Georgette Saree", "women-sarees", "Georgette", "saree", "s3", 8999, 12999, [C.plum, C.teal], O.free, "Size", "b"],
  ["Floral Printed Saree", "women-sarees", "Printed", "saree", "s1", 1999, 2999, [C.rose, C.mint], O.free, "Size", "s"],
  ["Floral Wrap Midi Dress", "women-dresses", "Midi Dresses", "dress", "s1", 2699, 3999, [C.marigold, C.teal], O.apparel, "Size", "b"],
  ["Ribbed Wrap Midi Dress", "women-dresses", "Midi Dresses", "dress", "s4", 2499, 3799, [C.plum, C.ink, C.rose], O.apparel, "Size", "n"],
  ["Pleated A-line Dress", "women-dresses", "A-Line", "dress", "s4", 2199, 3299, [C.forest, C.rose, C.ink], O.apparel, "Size", "s"],
  ["Summer Mini Dress", "women-dresses", "Mini Dresses", "dress", "s2", 1799, 2799, [C.sky, C.rose, C.white], O.apparel, "Size", "n"],
  ["High-rise Mom Jeans", "women-jeans", "Mom Fit", "jeans", "s4", 2199, 3299, [C.denim, C.white], O.jeans, "Size", "s"],
  ["Wide Leg Denim Jeans", "women-jeans", "Wide Leg", "jeans", "s4", 2299, 3499, [C.denim, C.ink], O.jeans, "Size", "n"],
  ["Skinny Stretch Jeans", "women-jeans", "Skinny Fit", "jeans", "s2", 1899, 2899, [C.ink, C.denim], O.jeans, "Size", "bs"],
  ["Printed Palazzo Pants", "women-pants-leggings", "Palazzo", "jeans", "s1", 1199, 1899, [C.indigo, C.mint], O.apparel, "Size", "n"],
  ["Everyday Leggings", "women-pants-leggings", "Leggings", "jeans", "s2", 599, 999, [C.ink, C.charcoal, C.maroon, C.forest], O.apparel, "Size", "bs"],
  ["Straight Fit Trousers", "women-pants-leggings", "Straight Pants", "jeans", "s4", 1699, 2599, [C.ink, C.sand], O.apparel, "Size", "b"],
  ["Cotton Salwar Suit Set", "women-ethnic-wear", "Salwar Suits", "kurta", "s1", 2399, 3799, [C.teal, C.rose], O.apparel, "Size", "bn"],
  ["Anarkali Set with Dupatta", "women-ethnic-wear", "Anarkali Sets", "kurta", "s3", 4299, 6499, [C.plum, C.emerald], O.apparel, "Size", "b"],
  ["Bridal Lehenga Choli Set", "women-ethnic-wear", "Lehenga Sets", "saree", "s3", 12999, 18999, [C.maroon, C.gold], O.apparel, "Size", "l"],
  ["Ethnic Co-ord Set", "women-ethnic-wear", "Ethnic Co-ord Sets", "kurta", "s1", 2999, 4499, [C.mint, C.ivory], O.apparel, "Size", "n"],
];

const copy: Record<string, { desc: string[]; spec: (s: Seed) => string; care: string[]; details: string[] }> = {
  fashion: {
    desc: ["Cut for easy movement and finished with care by small-batch makers. Easy to style from day to night.", "A staple designed to be worn on repeat. Soft hand-feel from the first wear and built to hold shape wash after wash."],
    spec: (s) => ({ kurta: "100% handloom cotton", saree: "Handwoven fabric, 5.5 m + blouse piece", shirt: "Premium woven cotton", tee: "240 GSM combed cotton jersey", jacket: "Cotton twill / denim", jeans: "98% cotton, 2% elastane denim", hoodie: "320 GSM brushed fleece", dress: "Viscose crepe, fully lined", sneaker: "Breathable mesh upper, EVA sole" } as Record<string, string>)[s[3]] ?? "Premium fabric",
    care: ["Machine wash cold, gentle cycle", "Wash dark colours separately", "Dry in shade"],
    details: ["True-to-size fit", "Colour may vary slightly with screen settings", "Made in India"],
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
  const c = copy.fashion;
  return {
    id: `p${i + 1}`, slug: slug(name), name, sellerId: seller, categorySlug: cat, subcategory: sub, photo, price, mrp, colors, optionLabel,
    sizes: options, stock, rating: Math.round((3.9 + rnd() * 1.0) * 10) / 10, reviewCount, sold: Math.floor(reviewCount * (2 + rnd() * 4)),
    badges, description: c.desc[i % c.desc.length], fabric: c.spec(s), care: c.care, details: c.details,
    createdAt: new Date(Date.UTC(2026, 9, 31 + day)).toISOString(),
    status: name === "Embroidered Festive Sherwani" ? "pending_review" : name === "Utility Cargo Shorts" ? "draft" : Object.values(stock).every((v) => v === 0) ? "out_of_stock" : "active",
    tags: [cat.replace(/^(men|women)-/, ""), sub.toLowerCase(), photo, ...colors.map((x) => x.name.toLowerCase())], images: [],
  };
});

// derive counts
categories.forEach((c) => { c.productCount = products.filter((p) => p.categorySlug === c.slug && p.status === "active").length; });
sellers.forEach((s) => { s.productCount = products.filter((p) => p.sellerId === s.id).length; });

/* ============================================================ Collections */
const byNames = (...names: string[]) => products.filter((p) => names.some((n) => p.name.startsWith(n))).map((p) => p.id);
export const collections: Collection[] = [
  { id: "col1", slug: "wedding-edit", name: "The Wedding Edit", story: "Silk sarees, lehengas and festive wear for the season of shaadis.", tone: ["#f3e6e6", "#b13a26"], photo: "saree", productIds: byNames("Kanjivaram", "Banarasi", "Natural-dye", "Chikankari", "Festive Floor", "Embroidered Festive", "Bridal", "Anarkali Set") },
  { id: "col2", slug: "street-style", name: "Street Style", story: "Tees, shirts and denim for everyday menswear.", tone: ["#e4ebf3", "#2a5db0"], photo: "shirt", productIds: byNames("Heavyweight Boxy", "Slim Fit Oxford", "Chambray", "Selvedge", "Utility Cargo", "Everyday Joggers", "Washed Denim Shorts") },
  { id: "col3", slug: "summer-edit", name: "The Summer Edit", story: "Light dresses, easy tops and breezy shorts for the warm months.", tone: ["#f0e6dc", "#a8764a"], photo: "dress", productIds: byNames("Floral Wrap", "Summer Mini", "Soft Knit", "Cropped Ribbed", "Printed Palazzo", "Cotton Casual Shorts", "Linen Camp") },
  { id: "col4", slug: "everyday-comfort", name: "Everyday Comfort", story: "Soft basics and easy fits you will reach for every day.", tone: ["#efe9dc", "#0f6b52"], photo: "tee", productIds: byNames("Everyday Leggings", "Everyday Joggers", "Slim Fit Crew", "Ribbed Wrap", "High-rise Mom", "Stretch Cotton", "Classic Pique") },
];

/* ================================================================ Lookups */
export const sellerById = (id: string) => sellers.find((s) => s.id === id);
export const productById = (id: string) => products.find((p) => p.id === id);
