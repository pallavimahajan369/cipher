import { Product } from "./types";

export const CURATED_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "AeroKeys Mechanical Keyboard",
    description: "A compact 75% layout mechanical keyboard with hot-swappable switches, double-shot PBT keycaps, and custom acoustic foam dampeners. Perfect for tactile, quiet, and satisfying typing sessions.",
    price: 139.00,
    category: "Minimalist Tech",
    rating: 4.8,
    reviewsCount: 14,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600",
    colors: ["Slate Gray", "Warm Oat", "Chalk White"],
    badge: "Staff Choice",
    inStock: true,
    featured: true,
    reviews: [
      { id: "rev-1-1", author: "Clara M.", rating: 5, comment: "The tactile feedback is incredible. Best typing sound I have ever experienced. Love the chalk white variant!", date: "2026-04-12" },
      { id: "rev-1-2", author: "Ethan W.", rating: 4, comment: "Excellent build quality. Wish the software was simpler, but the hardware is top-tier.", date: "2026-05-02" }
    ]
  },
  {
    id: "prod-2",
    name: "Aura Sound-Shield ANC Headphones",
    description: "Hybrid active noise cancelling wireless headphones. Equipped with custom tuned 40mm drivers, ultra-soft memory foam ear cups, and 45 hours of deep soundscape battery life.",
    price: 189.00,
    category: "Minimalist Tech",
    rating: 4.9,
    reviewsCount: 28,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
    colors: ["Midnight Blue", "Chalk White", "Charcoal Black"],
    badge: "Best Seller",
    parentid: "prod-2",
    inStock: true,
    featured: true,
    reviews: [
      { id: "rev-2-1", author: "Sophia R.", rating: 5, comment: "Blocks out highway and airplane noise beautifully. The cushions are premium soft.", date: "2026-03-20" },
      { id: "rev-2-2", author: "Liam T.", rating: 5, comment: "I wear these 8 hours a day working from home. Zero fatigue. Incredible sound profile.", date: "2026-04-01" },
      { id: "rev-2-3", author: "Yuki S.", rating: 4, comment: "Audio quality via Bluetooth is very crisp and clear, bass is rich but not overwhelming.", date: "2026-05-18" }
    ]
  } as any,
  {
    id: "prod-3",
    name: "ErgoGlide Wireless Mouse",
    description: "Sculpted precision mouse sporting a customized micro-contour frame, silent silent-click Omron switches, dual Bluetooth, and a high-precision optical sensor that tracks seamlessly on glass.",
    price: 79.00,
    category: "Minimalist Tech",
    rating: 4.6,
    reviewsCount: 19,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600",
    colors: ["Slate Gray", "Chalk White"],
    inStock: true,
    reviews: [
      { id: "rev-3-1", author: "Marcus D.", rating: 5, comment: "My wrist pain has completely disappeared since using this. Charges super fast via USB-C.", date: "2026-01-15" }
    ]
  },
  {
    id: "prod-4",
    name: "Merino Wool Nordic Beanie",
    description: "Spun from 100% fine Merino wool, providing natural thermal insulation, premium moisture-wicking comfort, and a gorgeous heavy-knit aesthetic. Double cuff adjustable fit.",
    price: 34.00,
    category: "Lifestyle & Apparel",
    rating: 4.7,
    reviewsCount: 32,
    image: "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?auto=format&fit=crop&q=80&w=600",
    colors: ["Heather Gray", "Oatmeal Beige", "Sage Green"],
    sizes: ["One Size"],
    badge: "Trending",
    inStock: true,
    featured: true,
    reviews: [
      { id: "rev-4-1", author: "Hanna B.", rating: 5, comment: "Unbelievably soft. Usually, beanies itch, but this feels premium and keeps me incredibly warm.", date: "2026-02-14" }
    ]
  },
  {
    id: "prod-5",
    name: "Heavyweight Loopback Hoodie",
    description: "Engineered from exceptionally dense 450gsm organic cotton French Terry. Featuring flat-lock seams, thick double-lined hood structure, and structured wide cuffs.",
    price: 89.00,
    category: "Lifestyle & Apparel",
    rating: 4.8,
    reviewsCount: 42,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600",
    colors: ["Charcoal Black", "Warm Oat", "Sand Dune"],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    reviews: [
      { id: "rev-5-1", author: "Julian K.", rating: 5, comment: "The weight of this hoodie is phenomenal. Fits beautifully and drapes perfectly.", date: "2026-05-01" },
      { id: "rev-5-2", author: "Elena P.", rating: 4, comment: "Very warm and cozy. Fits slightly oversized so size down if you like a snug fit.", date: "2026-05-14" }
    ]
  },
  {
    id: "prod-6",
    name: "Renewed Canvas Tote Bag",
    description: "Crafted from highly durable, water-resistant waxed recycled canvas with Italian vegetable-tanned leather straps. Features an integrated padded sleeve for up to a 15-inch laptop.",
    price: 55.00,
    category: "Lifestyle & Apparel",
    rating: 4.5,
    reviewsCount: 16,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600",
    colors: ["Olive Drab", "Desert Tan", "Coal Black"],
    inStock: false,
    reviews: [
      { id: "rev-6-1", author: "Tom G.", rating: 4, comment: "Beautiful bag for daily commute. Sadly went out of stock right after I bought my second, wanted one for my wife.", date: "2025-11-30" }
    ]
  },
  {
    id: "prod-7",
    name: "Japanese Soy Wax Candle Pack",
    description: "Hand-poured, clean-burning soy wax candles infused with essential oils of hinoki cypress, moss, and warm sandalwood. Housed in custom handcrafted ceramic vessels.",
    price: 42.00,
    category: "Curated Home",
    rating: 4.9,
    reviewsCount: 25,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600",
    colors: ["Hinoki Earth", "Sandalwood Stone"],
    badge: "Eco-Friendly",
    inStock: true,
    reviews: [
      { id: "rev-7-1", author: "Anika V.", rating: 5, comment: "My entire apartment smells like a serene Japanese forest. Cleanest burn ever, no soot.", date: "2026-04-20" }
    ]
  },
  {
    id: "prod-8",
    name: "Handmade Speckled Mug",
    description: "Fired in small batches by independent ceramicists. Features a raw sand texture exterior paired with a high-gloss milky white glazed interior. Dishwasher and microwave safe.",
    price: 24.00,
    category: "Curated Home",
    rating: 4.7,
    reviewsCount: 54,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600",
    colors: ["Speckled Sand", "Ash Gray"],
    inStock: true,
    featured: true,
    reviews: [
      { id: "rev-8-1", author: "Sarah L.", rating: 5, comment: "Feels comfortable in the hand, perfect weight distribution. I drink my tea from this every single morning.", date: "2026-04-18" },
      { id: "rev-8-2", author: "Daniel T.", rating: 4, comment: "Beautiful earthy vibes. Since each is unique, mine looks slightly more speckled than the picture, which is perfect.", date: "2026-05-19" }
    ]
  },
  {
    id: "prod-9",
    name: "Brushed Brass Incense Cult",
    description: "A geometric solid-brass block milled with double incense apertures of varying sizes. Designed to oxidize gracefully over time to form a unique rich amber patina.",
    price: 48.00,
    category: "Curated Home",
    rating: 4.4,
    reviewsCount: 11,
    image: "https://images.unsplash.com/photo-1602872030219-c1f0f4a0cdf9?auto=format&fit=crop&q=80&w=600",
    colors: ["Aged Brass", "Satin Gold"],
    inStock: true,
    reviews: [
      { id: "rev-9-1", author: "Lucas F.", rating: 4, comment: "Very substantial weight. Extremely minimal, looks like an art piece on my shelf.", date: "2026-03-05" }
    ]
  }
];
