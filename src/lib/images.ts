/**
 * Photo registry. Every product / category / banner points at a `PhotoKind`;
 * each kind has several verified Unsplash photos so galleries and variants differ.
 * Phase 7: products get their own `images[]` (Supabase Storage) and this becomes the fallback.
 */
export type PhotoKind =
  | "tee" | "shirt" | "kurta" | "saree" | "dress" | "jacket" | "jeans" | "hoodie" | "sneaker"
  | "bag" | "jewellery" | "sunglasses" | "watch"
  | "phone" | "headphones" | "earbuds" | "speaker" | "laptop" | "tablet" | "camera" | "gaming"
  | "sofa" | "decor" | "candle" | "kitchen" | "bedding" | "furniture" | "plant" | "bottle"
  | "skincare" | "makeup" | "perfume"
  | "coffee" | "tea" | "spices" | "snacks" | "groceries" | "books";

const R: Record<PhotoKind, string[]> = {
  tee: ["1521572163474-6864f9cf17ab", "1583743814966-8936f5b7be1a", "1618354691373-d851c5c3a990", "1576566588028-4147f3842f27"],
  shirt: ["1596755094514-f87e34085b2c", "1602810318383-e386cc2a3ccf", "1603252109303-2751441dd157", "1541101767792-f9b2b1c4f127"],
  kurta: ["1583391733956-3750e0ff4e8b", "1597983073493-88cd35cf93b0"],
  saree: ["1610030469983-98e550d6193c", "1597983073493-88cd35cf93b0", "1583391733956-3750e0ff4e8b"],
  dress: ["1496747611176-843222e1e57c", "1585487000160-6ebcfceb0d03", "1572804013309-59a88b7e92f1", "1566174053879-31528523f8ae", "1568252542512-9fe8fe9c87bb", "1609357605129-26f69add5d6e"],
  jacket: ["1551028719-00167b16eac5", "1591047139829-d91aecb6caea", "1487222477894-8943e31ef7b2", "1539109136881-3be0616acf4b"],
  jeans: ["1542272604-787c3835535d", "1541099649105-f69ad21f3246", "1624378439575-d8705ad7ae80", "1604176354204-9268737828e4"],
  hoodie: ["1556821840-3a63f95609a7", "1620799140188-3b2a02fd9a77", "1515886657613-9f3515b0c78f"],
  sneaker: ["1542291026-7eec264c27ff", "1491553895911-0055eca6402d", "1549298916-b41d501d3772", "1460353581641-37baddab0fa2", "1595950653106-6c9ebd614d3a", "1600185365483-26d7a4cc7519", "1608231387042-66d1773070a5"],
  bag: ["1548036328-c9fa89d128fa", "1584917865442-de89df76afd3", "1590874103328-eac38a683ce7", "1566150905458-1bf1fc113f0d"],
  jewellery: ["1515562141207-7a88fb7ce338", "1617038260897-41a1f14a8ca0", "1535632066927-ab7c9ab60908", "1573408301185-9146fe634ad0", "1599643478518-a784e5dc4c8f"],
  sunglasses: ["1572635196237-14b3f281503f"],
  watch: ["1523275335684-37898b6baf30", "1546868871-7041f2a55e12", "1600003014755-ba31aa59c4b6"],
  phone: ["1511707171634-5f897ff02aa9", "1598327105666-5b89351aff97", "1580910051074-3eb694886505", "1601784551446-20c9e07cdbdb", "1610945415295-d9bbf067e59c"],
  headphones: ["1505740420928-5e560c06d30e", "1583394838336-acd977736f90"],
  earbuds: ["1572569511254-d8f925fe2cbb", "1606220588913-b3aacb4d2f46", "1590658268037-6bf12165a8df"],
  speaker: ["1608043152269-423dbba4e7e1", "1545454675-3531b543be5d", "1558089687-f282ffcbc126"],
  laptop: ["1496181133206-80ce9b88a853", "1517336714731-489689fd1ca8", "1588872657578-7efd1f1555ed", "1593642632823-8f785ba67e45"],
  tablet: ["1544244015-0df4b3ffc6b0"],
  camera: ["1526170375885-4d8ecf77b99f"],
  gaming: ["1593305841991-05c297ba4575", "1527814050087-3793815479db", "1587829741301-dc798b83add3"],
  sofa: ["1555041469-a586c61ea9bc", "1493663284031-b7e3aefcae8e", "1578500494198-246f612d3b3d", "1513694203232-719a280e022f"],
  decor: ["1586023492125-27b2c045efd7", "1583847268964-b28dc8f51f92", "1618220179428-22790b461013", "1600210492486-724fe5c67fb0"],
  candle: ["1602874801007-bd458bb1b8b6"],
  kitchen: ["1585515320310-259814833e62", "1556911220-bff31c812dba", "1610701596007-11502861dcfa"],
  bedding: ["1522771739844-6a9f6d5f14af", "1631049307264-da0ec9d70304", "1584100936595-c0654b55a2e2", "1616486338812-3dadae4b4ace"],
  furniture: ["1503602642458-232111445657", "1567538096630-e0c55bd6374c", "1519710164239-da123dc03ef4"],
  plant: ["1485955900006-10f4d324d411"],
  bottle: ["1602143407151-7111542de6e8"],
  skincare: ["1556228720-195a672e8a03", "1620916566398-39f1143ab7be", "1598440947619-2c35fc9aa908", "1608248543803-ba4f8c70ae0b", "1571781926291-c477ebfd024b", "1612817288484-6f916006741a"],
  makeup: ["1596462502278-27bfdc403348", "1522335789203-aabd1fc54bc9"],
  perfume: ["1541643600914-78b084683601", "1592945403244-b3fbafd7f539", "1563170351-be82bc888aa4", "1523293182086-7651a899d37f"],
  coffee: ["1495474472287-4d71bcdd2085", "1544787219-7f47ccb76574"],
  tea: ["1544787219-7f47ccb76574", "1556679343-c7306c1976bc"],
  spices: ["1596040033229-a9821ebd058d", "1565557623262-b51c2513a641"],
  snacks: ["1599599810769-bcde5a160d32", "1621939514649-280e2ee25f60", "1558961363-fa8fdf82db35"],
  groceries: ["1542838132-92c53300491e", "1596040033229-a9821ebd058d"],
  books: ["1544947950-fa07a98d237f", "1512820790803-83ca734da794"],
};

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Deterministic photo URL: same (kind, seed, variant) → same image on server and client. */
export function photoUrl(kind: PhotoKind, opts: { seed?: string; variant?: string; view?: number; w?: number; h?: number } = {}) {
  const list = R[kind] ?? R.decor;
  const idx = (hash(`${kind}|${opts.seed ?? ""}|${opts.variant ?? ""}`) + (opts.view ?? 0)) % list.length;
  const { w = 600, h = 800 } = opts;
  return `https://images.unsplash.com/photo-${list[idx]}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}
