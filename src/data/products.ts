export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  images: string[];
  stockQuantity: number;
  lowStockThreshold: number;
  sku: string;
  unit: string;
  brand: string;
  isActive: boolean;
  isFeatured: boolean;
  isOnOffer: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  offerLabel?: string;
  specifications?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  icon: string;
  productCount: number;
}

export const categories: Category[] = [
  { id: "cat-1", name: "Door Locks & Security", slug: "door-locks", tagline: "Secure every entry point", icon: "Lock", productCount: 10 },
  { id: "cat-2", name: "Glass & Glazing", slug: "glass", tagline: "Crystal-clear solutions", icon: "Square", productCount: 7 },
  { id: "cat-3", name: "Roofing & IBR", slug: "roofing", tagline: "Cover what matters most", icon: "Home", productCount: 5 },
  { id: "cat-4", name: "Plumbing", slug: "plumbing", tagline: "Flow without interruption", icon: "Droplets", productCount: 5 },
  { id: "cat-5", name: "Tools", slug: "tools", tagline: "Built for the job at hand", icon: "Wrench", productCount: 4 },
  { id: "cat-6", name: "Fasteners", slug: "fasteners", tagline: "Hold it all together", icon: "Bolt", productCount: 3 },
];

export const products: Product[] = [
  {
    id: "p1", name: "3-Lever Mortice Lock (Brass)", slug: "3-lever-mortice-lock-brass",
    description: "Reliable 3-lever brass mortice lock for interior and exterior doors. Industry standard security for residential use.",
    price: 850, categoryId: "cat-1", images: [], stockQuantity: 24, lowStockThreshold: 5,
    sku: "SOS-DL-001", unit: "piece", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: true,
    specifications: { Material: "Brass", "Lock Type": "3-Lever Mortice", Finish: "Polished Brass" }
  },
  {
    id: "p2", name: "5-Lever Mortice Lock (Security)", slug: "5-lever-mortice-lock-security",
    description: "High-security 5-lever mortice lock. Insurance approved for enhanced protection on all door types.",
    price: 1400, categoryId: "cat-1", images: [], stockQuantity: 8, lowStockThreshold: 5,
    sku: "SOS-DL-002", unit: "piece", brand: "Generic", isActive: true, isFeatured: true,
    isOnOffer: false, isNewArrival: false, isBestSeller: false,
    specifications: { Material: "Steel", "Lock Type": "5-Lever Mortice", Finish: "Chrome" }
  },
  {
    id: "p3", name: "Yale Padlock 50mm", slug: "yale-padlock-50mm",
    description: "Classic Yale brass padlock. Hardened steel shackle for durability and protection.",
    price: 650, categoryId: "cat-1", images: [], stockQuantity: 18, lowStockThreshold: 5,
    sku: "SOS-DL-003", unit: "piece", brand: "Yale", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: false,
    specifications: { Material: "Brass Body, Steel Shackle", Size: "50mm", Brand: "Yale" }
  },
  {
    id: "p4", name: "Digital Keypad Door Lock", slug: "digital-keypad-door-lock",
    description: "Smart keyless entry with programmable PIN codes. Modern security for homes and offices. Batteries included.",
    price: 6999, originalPrice: 8500, categoryId: "cat-1", images: [], stockQuantity: 4, lowStockThreshold: 5,
    sku: "SOS-DL-004", unit: "piece", brand: "Generic", isActive: true, isFeatured: true,
    isOnOffer: true, isNewArrival: false, isBestSeller: false, offerLabel: "18% OFF",
    specifications: { Material: "Stainless Steel", "Lock Type": "Digital Keypad", Power: "4× AA Batteries", Features: "Auto-lock, Anti-peep PIN" }
  },
  {
    id: "p5", name: "Door Handle Set SS (Pair)", slug: "door-handle-set-ss",
    description: "Elegant stainless steel door handle set. Contemporary design. Includes mounting hardware.",
    price: 1200, categoryId: "cat-1", images: [], stockQuantity: 12, lowStockThreshold: 5,
    sku: "SOS-DL-005", unit: "pair", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: true, isBestSeller: false,
    specifications: { Material: "Stainless Steel", Finish: "Brushed", Type: "Lever on Rose" }
  },
  {
    id: "p6", name: "Gate Latch with Staple", slug: "gate-latch-staple",
    description: "Galvanised gate latch with matching staple. Suitable for wooden and metal gates.",
    price: 180, categoryId: "cat-1", images: [], stockQuantity: 3, lowStockThreshold: 5,
    sku: "SOS-DL-008", unit: "piece", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: false,
  },
  {
    id: "p7", name: "Clear Float Glass 4mm", slug: "clear-float-glass-4mm",
    description: "Premium quality 4mm clear float glass. Cut to size available in-store. Ideal for windows and picture frames.",
    price: 1100, categoryId: "cat-2", images: [], stockQuantity: 50, lowStockThreshold: 10,
    sku: "SOS-GL-001", unit: "per m²", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: true,
    specifications: { Thickness: "4mm", Type: "Clear Float", Application: "Windows, Frames" }
  },
  {
    id: "p8", name: "Frosted Glass 4mm", slug: "frosted-glass-4mm",
    description: "4mm frosted glass for privacy applications. Bathroom windows, office partitions, and decorative use.",
    price: 1400, categoryId: "cat-2", images: [], stockQuantity: 0, lowStockThreshold: 10,
    sku: "SOS-GL-003", unit: "per m²", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: false,
    specifications: { Thickness: "4mm", Type: "Frosted/Sandblasted" }
  },
  {
    id: "p9", name: "Mirror 600×600mm", slug: "mirror-600x600",
    description: "Polished edge mirror. Perfect for bathrooms and dressing rooms. Ready to mount.",
    price: 2200, categoryId: "cat-2", images: [], stockQuantity: 10, lowStockThreshold: 5,
    sku: "SOS-GL-007", unit: "piece", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: true, isBestSeller: false,
  },
  {
    id: "p10", name: "IBR Roofing Sheet 3m (G28)", slug: "ibr-roofing-sheet-3m",
    description: "Heavy gauge (G28) IBR roofing sheet. 3 metres long. Durable galvanised finish for long-lasting protection.",
    price: 1850, categoryId: "cat-3", images: [], stockQuantity: 45, lowStockThreshold: 10,
    sku: "SOS-RF-001", unit: "piece", brand: "Generic", isActive: true, isFeatured: true,
    isOnOffer: false, isNewArrival: false, isBestSeller: true,
    specifications: { Length: "3m", Gauge: "G28", Profile: "IBR", Material: "Galvanised Steel" }
  },
  {
    id: "p11", name: "PVC Gutter 3m", slug: "pvc-gutter-3m",
    description: "Durable PVC rain gutter. 3 metre length. UV resistant and easy to install.",
    price: 850, categoryId: "cat-3", images: [], stockQuantity: 20, lowStockThreshold: 5,
    sku: "SOS-RF-005", unit: "piece", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: false,
  },
  {
    id: "p12", name: "Kitchen Pillar Tap (Chrome)", slug: "kitchen-pillar-tap-chrome",
    description: "Chrome-plated kitchen pillar tap. Quarter-turn ceramic disc for smooth operation.",
    price: 580, originalPrice: 750, categoryId: "cat-4", images: [], stockQuantity: 6, lowStockThreshold: 5,
    sku: "SOS-PL-004", unit: "piece", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: true, isNewArrival: false, isBestSeller: false, offerLabel: "CLEARANCE",
    specifications: { Material: "Brass, Chrome Plated", Type: "Pillar Tap", Valve: "¼ Turn Ceramic Disc" }
  },
  {
    id: "p13", name: "Ball Valve ½\" (Brass)", slug: "ball-valve-half-inch",
    description: "Heavy-duty brass ball valve. ½ inch BSP threads. Full bore for maximum flow.",
    price: 320, categoryId: "cat-4", images: [], stockQuantity: 25, lowStockThreshold: 5,
    sku: "SOS-PL-003", unit: "piece", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: false,
  },
  {
    id: "p14", name: "Tape Measure 5m (Stanley)", slug: "tape-measure-5m-stanley",
    description: "Stanley 5m tape measure with magnetic tip and belt clip. Professional grade.",
    price: 650, categoryId: "cat-5", images: [], stockQuantity: 10, lowStockThreshold: 5,
    sku: "SOS-TL-002", unit: "piece", brand: "Stanley", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: true,
    specifications: { Brand: "Stanley", Length: "5m", Features: "Magnetic Tip, Belt Clip" }
  },
  {
    id: "p15", name: "Hacksaw + 5 Blades", slug: "hacksaw-5-blades",
    description: "Adjustable hacksaw frame with 5 bi-metal blades. Cuts metal, PVC, and wood.",
    price: 650, categoryId: "cat-5", images: [], stockQuantity: 12, lowStockThreshold: 5,
    sku: "SOS-TL-004", unit: "set", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: true, isBestSeller: false,
  },
  {
    id: "p16", name: "Wood Screws 3×30 (Box/100)", slug: "wood-screws-3x30",
    description: "Box of 100 countersunk wood screws. 3mm × 30mm. Zinc plated for corrosion resistance.",
    price: 220, categoryId: "cat-6", images: [], stockQuantity: 35, lowStockThreshold: 10,
    sku: "SOS-FT-002", unit: "box", brand: "Generic", isActive: true, isFeatured: false,
    isOnOffer: false, isNewArrival: false, isBestSeller: false,
  },
];

export function getProductsByCategory(categoryId: string) {
  return products.filter(p => p.categoryId === categoryId && p.isActive);
}

export function getFeaturedProducts() {
  return products.filter(p => p.isFeatured && p.isActive);
}

export function getOfferProducts() {
  return products.filter(p => p.isOnOffer && p.isActive);
}

export function getNewArrivals() {
  return products.filter(p => p.isNewArrival && p.isActive);
}

export function getBestSellers() {
  return products.filter(p => p.isBestSeller && p.isActive);
}

export function getProductBySlug(slug: string) {
  return products.find(p => p.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return categories.find(c => c.slug === slug);
}

export function formatPrice(price: number) {
  return `KES ${price.toLocaleString()}`;
}

export function getStockStatus(product: Product) {
  if (product.stockQuantity === 0) return "out_of_stock";
  if (product.stockQuantity <= product.lowStockThreshold) return "low_stock";
  return "in_stock";
}
