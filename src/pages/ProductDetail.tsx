import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Zap,
  MessageCircle,
  Minus,
  Plus,
  ChevronDown,
  MapPin,
  Truck,
  Shield,
  Eye,
  ArrowLeft,
  BadgeCheck,
} from "lucide-react";
import { useProductBySlug, useProducts, useCategories, formatPrice, getStockStatus } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/ProductCard";
import { toast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProductBySlug(slug || "");
  const { data: allProducts = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const [qty, setQty] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container py-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-square rounded-2xl shimmer" />
            <div className="space-y-4">
              <div className="h-4 w-24 rounded shimmer" />
              <div className="h-8 w-3/4 rounded shimmer" />
              <div className="h-10 w-32 rounded shimmer" />
              <div className="h-12 w-full rounded shimmer" />
              <div className="h-28 w-full rounded shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md px-4 text-center">
          <h1 className="mb-2 font-heading text-2xl font-bold">Product not found</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            The product you’re looking for may have been removed or its link may have changed.
          </p>
          <Link to="/products" className="text-primary hover:underline">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product);
  const isOutOfStock = stockStatus === "out_of_stock";
  const isLowStock = stockStatus === "low_stock";
  const related = allProducts.filter((p) => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);
  const specs = product.specifications as Record<string, string> | null;
  const currentCategory = categories.find((category) => category.id === product.category_id);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, qty);
    openCart();
    toast({ title: "Added to cart!", description: `${qty}× ${product.name}` });
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="container py-6 md:py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <Link
          to="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to catalogue
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="glass-card relative aspect-square overflow-hidden bg-surface-2">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[selectedImage]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                  <Eye className="h-24 w-24" />
                </div>
              )}

              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <span className="font-heading text-xl font-bold text-destructive">OUT OF STOCK</span>
                </div>
              )}

              {product.is_on_offer && product.offer_label && (
                <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-heading font-bold text-primary-foreground shadow-lg">
                  {product.offer_label}
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      selectedImage === i ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-background/40 p-5 md:p-6">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="label-caps text-primary">{product.brand || "SOS Hardware"}</span>
              </div>

              {currentCategory && (
                <div className="mb-5 rounded-2xl border border-border bg-surface/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="label-caps text-primary">Category</p>
                      <p className="mt-1 text-base font-semibold text-foreground">{currentCategory.name}</p>
                      {currentCategory.tagline && (
                        <p className="mt-1 text-sm text-muted-foreground">{currentCategory.tagline}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/category/${currentCategory.slug}`}
                        className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-amber-light"
                      >
                        Browse category
                      </Link>
                      <Link
                        to="/products"
                        className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                      >
                        View full catalogue
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">{product.name}</h1>
              <p className="mt-2 font-mono text-sm text-muted-foreground">SKU: {product.sku}</p>

              <div className="mt-5 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isOutOfStock ? "bg-destructive" : isLowStock ? "bg-warning animate-pulse-amber" : "bg-success"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-success"
                  }`}
                >
                  {isOutOfStock
                    ? "Out of stock"
                    : isLowStock
                      ? `Low stock — only ${product.stock_quantity} left`
                      : `In stock — ${product.stock_quantity} available`}
                </span>
              </div>

              <div className="mt-6 flex items-end gap-3">
                <span className="font-mono-price text-4xl text-primary">{formatPrice(product.price)}</span>
                {product.original_price && (
                  <span className="font-mono text-lg text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{product.unit}</p>

              <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

              <div className="mt-6 grid gap-3 rounded-2xl bg-surface/40 p-4 sm:grid-cols-3">
                <div className="flex items-start gap-2 text-sm">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Quality-checked supply</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Truck className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Pickup & delivery available</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Shield className="mt-0.5 h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Secure M-Pesa checkout</span>
                </div>
              </div>

              {!isOutOfStock && (
                <div className="mt-6">
                  <p className="mb-3 text-sm text-muted-foreground">Quantity</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-border bg-background">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="p-3 transition-colors hover:bg-muted"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-mono">{qty}</span>
                      <button
                        onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}
                        className="p-3 transition-colors hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.stock_quantity > 0 ? `Maximum ${product.stock_quantity}` : "Currently unavailable"}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-7 space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="glass-card w-full rounded-lg border-primary/30 py-3.5 text-base font-heading font-bold text-primary transition-all active:scale-[0.97] hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
                  </span>
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="w-full rounded-lg bg-primary py-3.5 text-base font-heading font-bold text-primary-foreground transition-all active:scale-[0.97] hover:bg-amber-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="h-5 w-5" />
                    BUY NOW
                  </span>
                </button>
              </div>

              <a
                href={`https://wa.me/254707209775?text=${encodeURIComponent(`Hi Steve, I'm interested in ${product.name} (SKU: ${product.sku})`)}`}
                target="_blank"
                rel="noopener"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                Ask on WhatsApp
              </a>

              <div className="mt-6 space-y-2">
                {[
                  {
                    icon: MapPin,
                    title: "Free pickup — Nyeri Town",
                    id: "pickup",
                    content: "Reserve online and collect from our Nyeri location once your order is ready.",
                  },
                  {
                    icon: Truck,
                    title: "Delivery available",
                    id: "delivery",
                    content: "Nyeri and upcountry delivery options are available. Final delivery cost is confirmed at checkout.",
                  },
                  {
                    icon: Shield,
                    title: "Secure payment options",
                    id: "mpesa",
                    content: "Pay instantly with M-Pesa or choose pay-later for pickup and selected deliveries.",
                  },
                ].map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-background/40">
                    <button
                      onClick={() => setExpandedSection(expandedSection === item.id ? null : item.id)}
                      className="flex w-full items-center gap-3 p-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="flex-1">{item.title}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedSection === item.id ? "rotate-180" : ""}`} />
                    </button>
                    {expandedSection === item.id && (
                      <div className="border-t border-border px-4 pb-4 pt-2 text-sm leading-6 text-muted-foreground">
                        {item.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {specs && Object.keys(specs).length > 0 && (
                <div className="mt-8">
                  <h3 className="mb-3 font-heading font-bold text-foreground">Specifications</h3>
                  <div className="overflow-hidden rounded-2xl border border-border">
                    {Object.entries(specs).map(([key, value], i) => (
                      <div
                        key={key}
                        className={`flex justify-between gap-6 px-4 py-3 text-sm ${i % 2 === 0 ? "bg-surface/50" : "bg-background"}`}
                      >
                        <span className="text-muted-foreground">{key}</span>
                        <span className="text-right font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="label-caps text-primary">You may also like</p>
                <h2 className="mt-2 font-heading text-2xl font-bold">Related Products</h2>
              </div>
              <Link to="/products" className="hidden text-sm font-medium text-primary hover:underline md:inline-flex">
                View all products
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
